'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Camera, Save, Phone, Calendar, Shuffle, Check, CreditCard, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { getRandomProfileAvatar, PROFILE_AVATAR_OPTIONS } from '@/lib/profile-avatars';
import axios from 'axios';

type AvatarMode = 'random' | 'fixed';

interface ProfileFormData {
  fullName: string;
  headline: string;
  bio: string;
  phone: string;
  dateOfBirth: string;
  city: string;
  country: string;
}

const EMPTY_PROFILE_FORM: ProfileFormData = {
  fullName: '',
  headline: '',
  bio: '',
  phone: '',
  dateOfBirth: '',
  city: '',
  country: '',
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [email, setEmail] = useState('');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('random');
  const [avatarUrl, setAvatarUrl] = useState(getRandomProfileAvatar());
  const [draftAvatarMode, setDraftAvatarMode] = useState<AvatarMode>('random');
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(getRandomProfileAvatar());

  const [formData, setFormData] = useState<ProfileFormData>(EMPTY_PROFILE_FORM);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const metadata = user.user_metadata || {};
      const initialMode: AvatarMode = metadata.avatar_mode === 'fixed' ? 'fixed' : 'random';
      const initialAvatar = metadata.avatar_url || getRandomProfileAvatar();

      setEmail(user.email || '');
      setAvatarMode(initialMode);
      setAvatarUrl(initialAvatar);
      setDraftAvatarMode(initialMode);
      setDraftAvatarUrl(initialAvatar);

      setFormData({
        fullName: metadata.full_name || '',
        headline: metadata.headline || '',
        bio: metadata.bio || '',
        phone: metadata.phone || '',
        dateOfBirth: metadata.date_of_birth || '',
        city: metadata.city || '',
        country: metadata.country || '',
      });
    };

    loadUser();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const openAvatarPicker = () => {
    setDraftAvatarMode(avatarMode);
    setDraftAvatarUrl(avatarUrl);
    setPickerOpen(true);
  };

  const confirmAvatarSelection = async () => {
    const nextMode: AvatarMode = draftAvatarMode;
    const nextAvatar =
      nextMode === 'random' ? getRandomProfileAvatar() : draftAvatarUrl;

    setAvatarMode(nextMode);
    setAvatarUrl(nextAvatar);
    setPickerOpen(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_mode: nextMode,
          avatar_url: nextAvatar,
        },
      });

      if (error) throw error;
      router.refresh();
    } catch {
      alert('Failed to update avatar');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          headline: formData.headline,
          bio: formData.bio,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          city: formData.city,
          country: formData.country,
          avatar_mode: avatarMode,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleManagePayments = async () => {
    try {
      setIsPortalLoading(true);
      const res = await axios.post('/api/stripe-portal');
      window.location.assign(res.data.url);
    } catch {
      alert('Unable to open payment portal. Please try again later.');
      setIsPortalLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-0.5 sm:px-0 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile, personal details, and avatar preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr_1fr] gap-6 items-stretch">
          <div className="xl:self-center">
            <div className="bg-card border border-border rounded-xl p-6 h-full">
              <div className="flex flex-col items-center justify-center text-center gap-4 h-full min-h-[260px]">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border border-border bg-muted">
                    <Image
                      src={avatarUrl}
                      alt="Profile avatar"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={openAvatarPicker}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-foreground">Profile Icon</p>
                  <p className="text-sm text-muted-foreground">
                    {avatarMode === 'random'
                      ? 'Random mode: changes at each login'
                      : 'Fixed mode: stays until you change it'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto sm:min-w-[220px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              {success && (
                <span className="text-sm text-green-500 font-medium text-center">Profile updated successfully!</span>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="headline" className="block text-sm font-medium text-foreground mb-1.5">
                Headline
              </label>
              <input
                id="headline"
                name="headline"
                type="text"
                value={formData.headline}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                placeholder="Jazz learner, musician, educator..."
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1.5">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contact & Personal Data
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="+55 11 99999-9999"
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground mb-1.5">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date of Birth
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1.5">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-foreground mb-1.5">
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Methods
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your cards and billing details through our secure Stripe portal.
              </p>
              <Button
                type="button"
                onClick={handleManagePayments}
                disabled={isPortalLoading}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPortalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wallet className="h-4 w-4 mr-2" />
                )}
                Manage Payment Methods
              </Button>
            </div>
          </div>
        </div>

      </form>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-xl p-5 space-y-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2 className="text-lg font-semibold text-foreground">Choose your avatar style</h2>
              <p className="text-sm text-muted-foreground">Pick a fixed icon or keep random mode.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDraftAvatarMode('random');
                setDraftAvatarUrl(getRandomProfileAvatar());
              }}
              className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                draftAvatarMode === 'random'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-accent/40'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shuffle className="h-4 w-4" />
                Random avatar on each login
              </span>
              {draftAvatarMode === 'random' && <Check className="h-4 w-4 text-primary" />}
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PROFILE_AVATAR_OPTIONS.map((option) => {
                const isSelected = draftAvatarMode === 'fixed' && draftAvatarUrl === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setDraftAvatarMode('fixed');
                      setDraftAvatarUrl(option);
                    }}
                    className={`relative rounded-lg border p-2 transition-colors ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/40'
                    }`}
                  >
                    <Image
                      src={option}
                      alt="Avatar option"
                      width={80}
                      height={80}
                      className="w-full h-auto rounded-md"
                    />
                    {isSelected && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={confirmAvatarSelection}>
                Confirm Avatar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
