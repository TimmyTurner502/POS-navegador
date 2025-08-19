

import React, { useState, useContext } from 'react';
import { AppContext } from '../../App';
import { User, Role, View } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../Icons';
import ConfirmModal from '../common/ConfirmModal';

const UserFormModal: React.FC<{ user: Partial<User> | null, roles: Role[], onClose: () => void, onSave: (user: User, password?: string) => void }> = ({ user, roles, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<User>>(user || { name: '', email: '', role: roles[1]?.name || '' });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }
        onSave({ ...formData, id: formData.id || Date.now().toString() } as User, password);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">{user?.id ? 'Editar' : 'Nuevo'} Usuario</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</span>
                        <input name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    </label>
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    </label>
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rol</span>
                        <select name="role" value={formData.role} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.id ? "Nueva Contraseña (opcional)" : "Contraseña"}</span>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required={!user?.id} />
                    </label>
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</span>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required={!user?.id || password !== ''} />
                    </label>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RoleManager: React.FC = () => {
    const context = useContext(AppContext);
    const [newRoleName, setNewRoleName] = useState('');
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    if (!context) return null;
    const { roles, setRoles, users, logAction } = context;

    const handlePermissionChange = (roleId: string, view: View, checked: boolean) => {
        setRoles(roles.map(role => {
            if (role.id === roleId) {
                const newPermissions = checked
                    ? [...role.permissions, view]
                    : role.permissions.filter(p => p !== view);
                return { ...role, permissions: newPermissions };
            }
            return role;
        }));
    };
    
    const handleAddRole = () => {
        if (!newRoleName.trim()) return;
        const newRole: Role = {
            id: `role-${Date.now()}`,
            name: newRoleName.trim(),
            permissions: [View.DASHBOARD] // Start with a default permission
        };
        setRoles([...roles, newRole]);
        logAction(`Rol creado: ${newRole.name}`);
        setNewRoleName('');
    };

    const handleUpdateRoleName = () => {
        if (!editingRole || !editingRole.name.trim()) return;
        
        // Prevent duplicate role names
        if (roles.some(r => r.name === editingRole.name && r.id !== editingRole.id)) {
            alert("Ya existe un rol con este nombre.");
            // Revert changes
            setEditingRole(roles.find(r => r.id === editingRole.id) || null);
            return;
        }

        setRoles(roles.map(r => r.id === editingRole.id ? editingRole : r));
        logAction(`Rol actualizado: ${editingRole.name}`);
        setEditingRole(null);
    }
    
    const confirmDeleteRole = () => {
        if (!roleToDelete) return;
        
        const isRoleInUse = users.some(user => user.role === roleToDelete.name);
        if (isRoleInUse) {
            alert(`No se puede eliminar el rol "${roleToDelete.name}" porque está asignado a uno o más usuarios.`);
            setRoleToDelete(null);
            return;
        }

        setRoles(roles.filter(r => r.id !== roleToDelete.id));
        logAction(`Rol eliminado: ${roleToDelete.name}`);
        setRoleToDelete(null);
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
            {roleToDelete && <ConfirmModal isOpen={!!roleToDelete} title="Eliminar Rol" message={`¿Seguro que quiere eliminar el rol "${roleToDelete.name}"?`} onConfirm={confirmDeleteRole} onCancel={() => setRoleToDelete(null)} />}
            <h3 className="text-xl font-semibold mb-4">Gestión de Roles</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Defina los permisos para cada rol en el sistema.</p>
            <div className="space-y-6">
                {roles.map(role => (
                    <div key={role.id}>
                        <div className="flex items-center justify-between">
                            {editingRole?.id === role.id ? (
                                <input 
                                    type="text"
                                    value={editingRole.name}
                                    onChange={e => setEditingRole({...editingRole, name: e.target.value})}
                                    onBlur={handleUpdateRoleName}
                                    onKeyDown={e => e.key === 'Enter' && handleUpdateRoleName()}
                                    className="p-1 border rounded-md dark:bg-gray-700 font-bold text-lg text-primary-600 dark:text-primary-400"
                                    autoFocus
                                />
                            ) : (
                                <h4 className="font-bold text-lg text-primary-600 dark:text-primary-400">{role.name}</h4>
                            )}
                            {role.name !== 'Administrador' && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingRole(role)} className="text-primary-600 hover:text-primary-800" title="Renombrar Rol"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => setRoleToDelete(role)} className="text-red-600 hover:text-red-800" title="Eliminar Rol"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {Object.values(View).map(view => (
                                <label key={view} className="flex items-center space-x-2 text-sm">
                                    <input
                                        type="checkbox"
                                        className="rounded text-primary-600 focus:ring-primary-500"
                                        checked={role.permissions.includes(view)}
                                        onChange={(e) => handlePermissionChange(role.id, view, e.target.checked)}
                                        disabled={role.name === 'Administrador'}
                                    />
                                    <span>{view}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-6 pt-4 border-t dark:border-gray-700">
                <h4 className="font-semibold mb-2">Nuevo Rol</h4>
                <div className="flex gap-2">
                    <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Nombre del nuevo rol" className="flex-grow p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" />
                    <button onClick={handleAddRole} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"><PlusIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};


const Users: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    if (!context) return null;
    const { users, setUsers, roles, logAction } = context;
    
    // Note: btoa is NOT a secure encryption method. It's just base64 encoding.
    // This is for demonstration purposes only in a client-side environment.
    // A real application MUST use a secure backend with proper hashing (e.g., bcrypt).
    const insecureEncrypt = (password: string) => btoa(password);

    const handleSaveUser = (user: User, password?: string) => {
        let userToSave = { ...user };
        if (password) {
            userToSave.password = insecureEncrypt(password);
        }

        if (editingUser?.id) {
            setUsers(users.map(u => u.id === userToSave.id ? userToSave : u));
            logAction(`Usuario actualizado: ${user.name}`, { type: 'user', id: user.id });
        } else {
            setUsers([...users, userToSave]);
            logAction(`Usuario creado: ${user.name}`, { type: 'user', id: user.id });
        }
    };
    
    const confirmDeleteUser = () => {
        if (!userToDelete) return;
        setUsers(users.filter(u => u.id !== userToDelete.id));
        logAction(`Usuario eliminado: ${userToDelete.name}`, { type: 'user', id: userToDelete.id });
        setUserToDelete(null);
    };

    const openModalForEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const openModalForNew = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    return (
        <div className="container mx-auto">
             {userToDelete && (
                <ConfirmModal
                    isOpen={!!userToDelete}
                    title="Confirmar Eliminación"
                    message={`¿Está seguro de que desea eliminar al usuario "${userToDelete.name}"?`}
                    onConfirm={confirmDeleteUser}
                    onCancel={() => setUserToDelete(null)}
                />
            )}

            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Usuarios y Roles</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Lista de Usuarios</h3>
                        <button onClick={openModalForNew} className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow text-sm">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Nuevo Usuario
                        </button>
                    </div>
                     <div className="p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 text-sm mb-4">
                        <strong>Advertencia:</strong> La gestión de contraseñas aquí es solo una demostración y NO es segura. No use contraseñas reales.
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Nombre</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Rol</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b dark:border-gray-700">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">{user.role}</td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <button onClick={() => openModalForEdit(user)} className="text-primary-600 hover:text-primary-800 mr-2" title="Editar / Cambiar Contraseña"><PencilIcon className="w-5 h-5"/></button>
                                            {user.role !== 'Administrador' && <button onClick={() => setUserToDelete(user)} className="text-red-600 hover:text-red-800" title="Eliminar"><TrashIcon className="w-5 h-5"/></button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <RoleManager />
            </div>

            {isModalOpen && <UserFormModal user={editingUser} roles={roles} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} />}
        </div>
    );
};

export default Users;