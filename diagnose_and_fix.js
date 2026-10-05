#!/usr/bin/env node
/**
 * Script para diagnosticar e corrigir a tabela badges no Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vottiwsddmwkiyztxjag.supabase.co';
const supabaseKey = 'sb_publishable_GBNvHFIxyN0erwiWQqSiMg_H31jz3V1';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔌 Conectando ao Supabase via REST API...\n');

  // DIAGNÓSTICO 1: Ver dados existentes
  console.log('='.repeat(60));
  console.log('📋 DIAGNÓSTICO: Dados existentes na tabela badges');
  console.log('='.repeat(60));
  
  const { data: existingBadges, error: selectError } = await supabase
    .from('badges')
    .select('*')
    .limit(10);

  if (selectError) {
    console.log(`❌ Erro ao ler badges: ${selectError.message}`);
    if (selectError.message.includes('relation') || selectError.message.includes('does not exist')) {
      console.log('\n⚠️  Tabela badges não existe ou não está acessível via RLS');
      console.log('Solução: Aplicar APPLY_SECURITY_ONLY.sql no Dashboard primeiro');
      process.exit(1);
    }
  } else {
    console.log(`✅ ${existingBadges.length} badge(s) encontrado(s):`);
    existingBadges.forEach(b => {
      console.log(`  - ${b.code}: name=${b.name}, title=${b.title}`);
    });
  }

  // Detectar qual coluna existe
  const hasName = existingBadges && existingBadges[0] && 'name' in existingBadges[0];
  const hasTitle = existingBadges && existingBadges[0] && 'title' in existingBadges[0];
  
  console.log(`\n🔍 Coluna 'name': ${hasName ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);
  console.log(`🔍 Coluna 'title': ${hasTitle ? '✅ EXISTE' : '❌ NÃO EXISTE'}`);

  // APLICAR FIX
  console.log('\n' + '='.repeat(60));
  console.log('🔧 APLICANDO FIX DOS BADGES');
  console.log('='.repeat(60));

  const badgesData = [
    {
      code: 'FIRST_KAIZEN',
      badgeName: 'Primeiro Passo',
      description: 'Submeteu sua primeira ideia de melhoria Kaizen',
      icon: 'Sparkles',
      points_required: 0,
      color: 'blue'
    },
    {
      code: 'BRONZE_CONTRIBUTOR',
      badgeName: 'Inovador Bronze',
      description: 'Alcançou 30 pontos em melhorias aprovadas',
      icon: 'Award',
      points_required: 30,
      color: 'amber'
    },
    {
      code: 'SILVER_CONTRIBUTOR',
      badgeName: 'Inovador Prata',
      description: 'Alcançou 70 pontos em melhorias aprovadas',
      icon: 'ShieldCheck',
      points_required: 70,
      color: 'slate'
    },
    {
      code: 'GOLD_CONTRIBUTOR',
      badgeName: 'Inovador Ouro',
      description: 'Alcançou 150 pontos e liderança no ranking',
      icon: 'Trophy',
      points_required: 150,
      color: 'yellow'
    },
    {
      code: 'ROI_CHAMPION',
      badgeName: 'Campeão de Economia',
      description: 'Criou um Kaizen com economia acima de R$ 5.000',
      icon: 'DollarSign',
      points_required: 0,
      color: 'emerald'
    },
    {
      code: 'SAFETY_GUARDIAN',
      badgeName: 'Guardião da Segurança',
      description: 'Kaizen aprovado na categoria Segurança do Trabalho',
      icon: 'Shield',
      points_required: 0,
      color: 'red'
    }
  ];

  console.log(`📌 Modo: Usando API REST do Supabase (não consegue detectar schema)`);
  console.log(`⚠️  LIMITAÇÃO: Via API REST, não consigo fazer UPSERT dinâmico`);
  console.log(`\n🔄 Vou tentar inserir usando ambas as estratégias...\n`);

  for (const badge of badgesData) {
    const { badgeName, ...rest } = badge;
    
    // Tentativa 1: usando 'name'
    const payload1 = { ...rest, name: badgeName };
    const { data: data1, error: error1 } = await supabase
      .from('badges')
      .upsert(payload1, { onConflict: 'code' });

    if (error1) {
      // Tentativa 2: usando 'title'
      const payload2 = { ...rest, title: badgeName };
      const { data: data2, error: error2 } = await supabase
        .from('badges')
        .upsert(payload2, { onConflict: 'code' });

      if (error2) {
        console.log(`  ❌ ${badge.code}: ${error2.message}`);
      } else {
        console.log(`  ✅ ${badge.code} (usando 'title')`);
      }
    } else {
      console.log(`  ✅ ${badge.code} (usando 'name')`);
    }
  }

  // VERIFICAÇÃO FINAL
  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICAÇÃO FINAL');
  console.log('='.repeat(60));
  
  const { data: finalBadges, error: finalError } = await supabase
    .from('badges')
    .select('code, name, title, points_required')
    .order('points_required')
    .order('code');

  if (finalError) {
    console.log(`❌ Erro na verificação: ${finalError.message}`);
  } else {
    console.log(`\n${'CODE'.padEnd(22)} ${'NAME/TITLE'.padEnd(20)} POINTS`);
    console.log('-'.repeat(60));
    finalBadges.forEach(b => {
      const displayName = b.name || b.title || '(null)';
      console.log(`${b.code.padEnd(22)} ${displayName.padEnd(20)} ${b.points_required}`);
    });
    console.log(`\n🎉 Total de badges: ${finalBadges.length}`);
  }

  console.log('\n✅ FIX CONCLUÍDO!');
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
