import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Lock, Bell, Database, Save, User, Camera, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, UpdateProfileRequest } from '../../services/userService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'users' | 'security' | 'notifications' | 'database' | null;
}

export default function SettingsModal({ isOpen, onClose, type }: SettingsModalProps) {
  const { authUser,showLogoutModal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    phone: '',
    departement: '',
    email: '',
  });

  const [avatar, setAvatar] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    if (isOpen && authUser) {
      const loadUserProfile = async () => {
        try {
          const profile = await userService.getCurrentProfile();
          setFormData({
            nom: profile.nom || '',
            prenom: profile.prenom || '',
            phone: profile.phone || '',
            departement: profile.departement || '',
            email: profile.email || '',
          });
          setAvatar(profile.avatar || `https://ui-avatars.com/api/?name=${profile.prenom}+${profile.nom}&background=random`);
        } catch (err) {
          console.error('Erreur de chargement du profil:', err);
        }
      };
      loadUserProfile();
    }
  }, [isOpen, authUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        setError(null);

        const avatarUrl = await userService.uploadAvatar(file);

        const fullAvatarUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${avatarUrl}`;
        setAvatar(fullAvatarUrl);

        await userService.updateProfile({ avatar: avatarUrl });

        setSuccess('Photo de profil mise à jour avec succès');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la mise à jour de la photo');
        setTimeout(() => setError(null), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const updateData: UpdateProfileRequest = {
        nom: formData.nom,
        prenom: formData.prenom,
        phone: formData.phone,
        departement: formData.departement,
      };

      await userService.updateProfile(updateData);
      setSuccess('Profil mis à jour avec succès');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };



  if (!isOpen || !type) return null;

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Gestion des Utilisateurs</h4>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-4">Photo de Profil</h5>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={avatar}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{formData.prenom} {formData.nom}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Cliquez sur l'icône de caméra pour changer votre photo de profil
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prénom
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Département
              </label>
              <input
                type="text"
                name="departement"
                value={formData.departement}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {(error || success) && (
          <div className={`mt-4 p-4 rounded-lg ${error ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'}`}>
            {error || success}
          </div>
        )}
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Paramètres de Sécurité</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-6">
            <h5 className="font-medium text-red-900 dark:text-red-200 mb-2 flex items-center space-x-2">
              <KeyRound className="h-5 w-5" />
              <span>En confirmant le changement</span>
            </h5>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Vous ne pouvez plus se connecter vià votre ancien mot de passe après avoir changé votre mot de passe.
            </p>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <KeyRound className="h-4 w-4" />
              <span>Confirmer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Paramètres de Notifications</h4>
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Notifications Email</h5>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Nouveaux stagiaires</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Projets en retard</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Rapports hebdomadaires</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Notifications Push</h5>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Tâches terminées</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Mentions dans les commentaires</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fréquence des résumés
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="never">Jamais</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Gestion des Données</h4>
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Sauvegarde Automatique</h5>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Dernière sauvegarde: Il y a 2 heures</span>
              <button className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors">
                Sauvegarder maintenant
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Export des Données</h5>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                Exporter les données des stagiaires (CSV)
              </button>
              <button className="w-full text-left px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                Exporter les projets (JSON)
              </button>
              <button className="w-full text-left px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
                Exporter tous les rapports (PDF)
              </button>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h5 className="font-medium text-red-900 dark:text-red-200 mb-2">Zone de Danger</h5>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Ces actions sont irréversibles. Procédez avec prudence.
            </p>
            <div className="space-y-2">
              <button className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors">
                Réinitialiser toutes les données
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const getModalTitle = () => {
    switch (type) {
      case 'users':
        return 'Gestion des Utilisateurs';
      case 'security':
        return 'Paramètres de Sécurité';
      case 'notifications':
        return 'Notifications';
      case 'database':
        return 'Gestion des Données';
      default:
        return 'Paramètres';
    }
  };

  const getModalIcon = () => {
    switch (type) {
      case 'users':
        return <Users className="h-6 w-6 text-orange-500" />;
      case 'security':
        return <Lock className="h-6 w-6 text-orange-500" />;
      case 'notifications':
        return <Bell className="h-6 w-6 text-orange-500" />;
      case 'database':
        return <Database className="h-6 w-6 text-orange-500" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'users':
        return renderUserManagement();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'database':
        return renderDatabaseSettings();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getModalIcon()}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{getModalTitle()}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {renderContent()}

          {type === 'users' && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
