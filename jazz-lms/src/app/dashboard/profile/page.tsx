'use client';

import { useState } from 'react';
import { User, Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    website: '',
    location: '',
  });

  // Load user data on mount
  useState(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData({
          fullName: user.user_metadata?.full_name || '',
          bio: user.user_metadata?.bio || '',
          website: user.user_metadata?.website || '',
          location: user.user_metadata?.location || '',
        });
      }
    };
    loadUser();
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName,
          bio: formData.bio,
          website: formData.website,
          location: formData.location,
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

  return (
    <div className="max-w-2xl mx-auto px-0.5 sm:px-0 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your public profile information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar section */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <p className="font-medium text-foreground">Profile Photo</p>
              <p className="text-sm text-muted-foreground">
                Click the camera icon to update your photo
              </p>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
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
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
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
            <label
              htmlFor="website"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Website
            </label>
            <input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              placeholder="City, Country"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          {success && (
            <span className="text-sm text-green-500 font-medium">
              Profile updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
