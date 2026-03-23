import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/database.types';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { UserCheck, UserX, Shield } from 'lucide-react';

export function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast.error('Erro ao atualizar status do usuário');
      return;
    }

    toast.success('Status atualizado com sucesso!');
    fetchUsers();
  };

  const promoteToAdmin = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (error) {
      toast.error('Erro ao promover usuário');
      return;
    }

    toast.success('Usuário promovido a administrador!');
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
        <p className="text-gray-600 mt-1">Gerencie todos os usuários do sistema</p>
      </div>

      {loading ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} hover>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                      {user.role === 'admin' ? (
                        <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-300">
                          <Shield className="w-3 h-3 mr-1" />
                          Administrador
                        </Badge>
                      ) : (
                        <Badge variant="default">Funcionário</Badge>
                      )}
                      {user.is_active ? (
                        <Badge variant="approved">Ativo</Badge>
                      ) : (
                        <Badge variant="rejected">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Pontos: {user.points}</span>
                      <span>Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role === 'employee' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => promoteToAdmin(user.id)}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Promover a Admin
                      </Button>
                    )}
                    <Button
                      variant={user.is_active ? 'danger' : 'success'}
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="w-4 h-4 mr-1" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
