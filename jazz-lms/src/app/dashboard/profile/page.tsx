'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Camera, Save, Phone, Calendar, Shuffle, Check, CreditCard, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { getRandomProfileAvatar, PROFILE_AVATAR_OPTIONS } from '@/lib/profile-avatars';
import { useLanguage } from '@/components/providers/language-provider';
import { JazzMedalIcon, JazzSupremeMedal } from '@/components/course/lesson-quiz-medal';
import { useUserJazzMedalProfile } from '@/hooks/use-user-jazz-medal-profile';

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
  const { language } = useLanguage();
  const copy = {
    es: {
      avatarUpdateError: 'No se pudo actualizar el avatar',
      profileUpdateError: 'No se pudo actualizar el perfil',
      billingSupportError: 'No se pudo abrir el canal de soporte de pagos. Inténtalo más tarde.',
      title: 'Perfil',
      subtitle: 'Gestiona tu perfil, datos personales y preferencias de avatar',
      profileIcon: 'Icono de perfil',
      randomModeDesc: 'Modo aleatorio: cambia en cada inicio de sesión',
      fixedModeDesc: 'Modo fijo: se mantiene hasta que lo cambies',
      saving: 'Guardando...',
      saveChanges: 'Guardar cambios',
      profileUpdated: '¡Perfil actualizado correctamente!',
      profileInfo: 'Información del perfil',
      fullName: 'Nombre completo',
      fullNamePlaceholder: 'Tu nombre completo',
      headline: 'Titular',
      bio: 'Biografía',
      bioPlaceholder: 'Cuéntanos sobre ti...',
      email: 'Correo',
      contactData: 'Contacto y datos personales',
      phone: 'Teléfono',
      birthDate: 'Fecha de nacimiento',
      city: 'Ciudad',
      cityPlaceholder: 'Ciudad',
      country: 'País',
      countryPlaceholder: 'País',
      paymentMethods: 'Métodos de pago',
      paymentMethodsDesc: 'Para gestionar tus datos de facturación, contacta con nuestro soporte financiero.',
      managePaymentMethods: 'Contactar soporte financiero',
      chooseAvatarStyle: 'Elige tu estilo de avatar',
      chooseAvatarDesc: 'Selecciona un icono fijo o mantén el modo aleatorio.',
      randomAvatarOption: 'Avatar aleatorio en cada inicio de sesión',
      avatarOptionAlt: 'Opción de avatar',
      profileAvatarAlt: 'Avatar de perfil',
      headlinePlaceholder: 'Aprendiz de jazz, músico, educador...',
      phonePlaceholder: '+34 600 000 000',
      cancel: 'Cancelar',
      confirmAvatar: 'Confirmar avatar',
      medalTooltipPrefix: 'Ganada en',
      medalTooltipEmpty: 'Aun sin medalla',
      medalShowcaseTitle: 'Vitrina de medallas',
      platinumProgressLabel: 'Medallas de platino',
      supremeUnlocked: 'Has desbloqueado tu medalla suprema.',
      supremeLocked: 'Cuando completes las 15 medallas de platino, aparecerá aquí tu medalla suprema.',
      supremeTitle: 'Especialista en jazz',
      openSupremePage: 'Ver reconocimiento especial',
    },
    en: {
      avatarUpdateError: 'Unable to update avatar',
      profileUpdateError: 'Unable to update profile',
      billingSupportError: 'Unable to open billing support. Please try again later.',
      title: 'Profile',
      subtitle: 'Manage your profile, personal data, and avatar preferences',
      profileIcon: 'Profile icon',
      randomModeDesc: 'Random mode: changes on each sign-in',
      fixedModeDesc: 'Fixed mode: stays until you change it',
      saving: 'Saving...',
      saveChanges: 'Save changes',
      profileUpdated: 'Profile updated successfully!',
      profileInfo: 'Profile information',
      fullName: 'Full name',
      fullNamePlaceholder: 'Your full name',
      headline: 'Headline',
      bio: 'Biography',
      bioPlaceholder: 'Tell us about yourself...',
      email: 'Email',
      contactData: 'Contact and personal data',
      phone: 'Phone',
      birthDate: 'Date of birth',
      city: 'City',
      cityPlaceholder: 'City',
      country: 'Country',
      countryPlaceholder: 'Country',
      paymentMethods: 'Payment methods',
      paymentMethodsDesc: 'To manage billing details, contact our finance support channel.',
      managePaymentMethods: 'Contact finance support',
      chooseAvatarStyle: 'Choose your avatar style',
      chooseAvatarDesc: 'Select a fixed icon or keep random mode.',
      randomAvatarOption: 'Random avatar at each sign-in',
      avatarOptionAlt: 'Avatar option',
      profileAvatarAlt: 'Profile avatar',
      headlinePlaceholder: 'Jazz learner, musician, educator...',
      phonePlaceholder: '+1 555 123 4567',
      cancel: 'Cancel',
      confirmAvatar: 'Confirm avatar',
      medalTooltipPrefix: 'Earned in',
      medalTooltipEmpty: 'No medal yet',
      medalShowcaseTitle: 'Medal showcase',
      platinumProgressLabel: 'Platinum medals',
      supremeUnlocked: 'You unlocked your supreme medal.',
      supremeLocked: 'When you complete all 15 platinum medals, your supreme medal will appear here.',
      supremeTitle: 'Jazz specialist',
      openSupremePage: 'View special recognition',
    },
    fr: {
      avatarUpdateError: 'Impossible de mettre à jour l’avatar',
      profileUpdateError: 'Impossible de mettre à jour le profil',
      billingSupportError: 'Impossible d’ouvrir le support de facturation. Réessayez plus tard.',
      title: 'Profil',
      subtitle: 'Gérez votre profil, vos données personnelles et vos préférences d’avatar',
      profileIcon: 'Icône de profil',
      randomModeDesc: 'Mode aléatoire : change à chaque connexion',
      fixedModeDesc: 'Mode fixe : reste identique jusqu’à modification',
      saving: 'Enregistrement...',
      saveChanges: 'Enregistrer les modifications',
      profileUpdated: 'Profil mis à jour avec succès !',
      profileInfo: 'Informations du profil',
      fullName: 'Nom complet',
      fullNamePlaceholder: 'Votre nom complet',
      headline: 'Titre',
      bio: 'Biographie',
      bioPlaceholder: 'Parlez-nous de vous...',
      email: 'E-mail',
      contactData: 'Contact et données personnelles',
      phone: 'Téléphone',
      birthDate: 'Date de naissance',
      city: 'Ville',
      cityPlaceholder: 'Ville',
      country: 'Pays',
      countryPlaceholder: 'Pays',
      paymentMethods: 'Moyens de paiement',
      paymentMethodsDesc: 'Pour gérer la facturation, contactez notre support financier.',
      managePaymentMethods: 'Contacter le support financier',
      chooseAvatarStyle: 'Choisissez votre style d’avatar',
      chooseAvatarDesc: 'Sélectionnez une icône fixe ou conservez le mode aléatoire.',
      randomAvatarOption: 'Avatar aléatoire à chaque connexion',
      avatarOptionAlt: 'Option d’avatar',
      profileAvatarAlt: 'Avatar de profil',
      headlinePlaceholder: 'Passionné de jazz, musicien, enseignant...',
      phonePlaceholder: '+33 6 12 34 56 78',
      cancel: 'Annuler',
      confirmAvatar: 'Confirmer l’avatar',
      medalTooltipPrefix: 'Gagnee dans',
      medalTooltipEmpty: 'Pas encore de medaille',
      medalShowcaseTitle: 'Vitrine des medailles',
      platinumProgressLabel: 'Medailles platine',
      supremeUnlocked: 'Votre medaille supreme est debloquee.',
      supremeLocked: 'Quand vous aurez les 15 medailles platine, votre medaille supreme apparaitra ici.',
      supremeTitle: 'Specialiste du jazz',
      openSupremePage: 'Voir la reconnaissance speciale',
    },
    pt: {
      avatarUpdateError: 'Não foi possível atualizar o avatar',
      profileUpdateError: 'Não foi possível atualizar o perfil',
      billingSupportError: 'Não foi possível abrir o suporte financeiro. Tente novamente mais tarde.',
      title: 'Perfil',
      subtitle: 'Gerencie seu perfil, dados pessoais e preferências de avatar',
      profileIcon: 'Ícone de perfil',
      randomModeDesc: 'Modo aleatório: muda a cada login',
      fixedModeDesc: 'Modo fixo: permanece até você alterar',
      saving: 'Salvando...',
      saveChanges: 'Salvar alterações',
      profileUpdated: 'Perfil atualizado com sucesso!',
      profileInfo: 'Informações do perfil',
      fullName: 'Nome completo',
      fullNamePlaceholder: 'Seu nome completo',
      headline: 'Título',
      bio: 'Biografia',
      bioPlaceholder: 'Conte-nos sobre você...',
      email: 'E-mail',
      contactData: 'Contato e dados pessoais',
      phone: 'Telefone',
      birthDate: 'Data de nascimento',
      city: 'Cidade',
      cityPlaceholder: 'Cidade',
      country: 'País',
      countryPlaceholder: 'País',
      paymentMethods: 'Métodos de pagamento',
      paymentMethodsDesc: 'Para gerenciar dados de cobrança, entre em contato com o suporte financeiro.',
      managePaymentMethods: 'Contatar suporte financeiro',
      chooseAvatarStyle: 'Escolha seu estilo de avatar',
      chooseAvatarDesc: 'Selecione um ícone fixo ou mantenha o modo aleatório.',
      randomAvatarOption: 'Avatar aleatório em cada login',
      avatarOptionAlt: 'Opção de avatar',
      profileAvatarAlt: 'Avatar de perfil',
      headlinePlaceholder: 'Aprendiz de jazz, músico, educador...',
      phonePlaceholder: '+55 11 99999-9999',
      cancel: 'Cancelar',
      confirmAvatar: 'Confirmar avatar',
      medalTooltipPrefix: 'Ganha na',
      medalTooltipEmpty: 'Sem medalha ainda',
      medalShowcaseTitle: 'Vitrine de medalhas',
      platinumProgressLabel: 'Medalhas de platina',
      supremeUnlocked: 'Voce desbloqueou sua medalha suprema.',
      supremeLocked: 'Quando completar as 15 medalhas de platina, sua medalha suprema vai aparecer aqui.',
      supremeTitle: 'Especialista em jazz',
      openSupremePage: 'Ver reconhecimento especial',
    },
  }[language];
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSupportLoading, setIsSupportLoading] = useState(false);
  const [email, setEmail] = useState('');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('random');
  const [avatarUrl, setAvatarUrl] = useState(getRandomProfileAvatar());
  const [draftAvatarMode, setDraftAvatarMode] = useState<AvatarMode>('random');
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(getRandomProfileAvatar());
  const [activeMedalTooltip, setActiveMedalTooltip] = useState<string | null>(null);
  const { profile: medalProfile } = useUserJazzMedalProfile(language);

  const [formData, setFormData] = useState<ProfileFormData>(EMPTY_PROFILE_FORM);
  const medalProgress = medalProfile?.progress ?? null;
  const medalLessons = medalProfile?.lessons ?? [];
  const activeProfileMedal = medalProgress?.activeProfileMedal ?? 'NONE';
  const visibleMedalLessons = useMemo(
    () => medalLessons.slice(0, 15),
    [medalLessons]
  );

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
      alert(copy.avatarUpdateError);
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
      alert(copy.profileUpdateError);
    } finally {
      setLoading(false);
    }
  };

  const handleManagePayments = async () => {
    try {
      setIsSupportLoading(true);
      const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'admin@neurofactory.net';
      const subject = encodeURIComponent('Billing support request');
      const body = encodeURIComponent(`Hello, I need help with my billing details for account: ${email || 'unknown'}.`);
      window.location.assign(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
    } catch {
      alert(copy.billingSupportError);
    } finally {
      setIsSupportLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-0.5 sm:px-0 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">{copy.title}</h1>
        <p className="text-muted-foreground mt-1">
          {copy.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr_1fr] gap-6 items-stretch">
          <div className="xl:self-center">
            <div className="bg-card border border-border rounded-xl p-6 h-full">
              <div className="flex flex-col gap-5 h-full min-h-[260px]">
                <div className="flex flex-col items-center justify-center text-center gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-border bg-muted">
                      <Image
                        src={avatarUrl}
                        alt={copy.profileAvatarAlt}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openAvatarPicker}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground">{copy.profileIcon}</p>
                  <p className="text-sm text-muted-foreground">
                    {avatarMode === 'random'
                      ? copy.randomModeDesc
                      : copy.fixedModeDesc}
                  </p>
                </div>

                <div className="w-full rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.12),_transparent_24%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(24,24,27,0.92),rgba(30,41,59,0.96))] p-4 shadow-[0_22px_44px_rgba(15,23,42,0.26)]">
                  <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-primary/80">{copy.medalShowcaseTitle}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {medalProgress ? `${medalProgress.platinumMedalCount}/${medalProgress.totalRequiredPlatinumMedals}` : '0/15'} {copy.platinumProgressLabel}
                      </p>
                    </div>
                    {activeProfileMedal !== 'NONE' ? (
                      <div className="shrink-0 rounded-full border border-white/15 bg-card/90 p-2 shadow-lg" data-testid="profile-active-medal">
                        {activeProfileMedal === 'SUPREME' ? (
                          <JazzSupremeMedal language={language} size="sm" />
                        ) : (
                          <JazzMedalIcon medal={activeProfileMedal} size="sm" />
                        )}
                      </div>
                    ) : (
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/10 bg-white/5 opacity-60">
                        <JazzMedalIcon medal="NONE" size="sm" />
                      </div>
                    )}
                  </div>

                  {!medalProgress?.hasSupremeMedal ? (
                    <div
                      className="mx-auto grid w-full max-w-[18rem] grid-cols-5 gap-3"
                      data-testid="profile-medal-grid"
                    >
                      {visibleMedalLessons.map((lesson: (typeof visibleMedalLessons)[number]) => {
                        const isEarned = lesson.medal !== 'NONE';

                        if (!isEarned) {
                          return (
                            <span
                              key={`empty-medal-${lesson.classNumber}`}
                              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/10 bg-white/5 opacity-45"
                              aria-label={copy.medalTooltipEmpty}
                              data-testid={`profile-medal-slot-${lesson.classNumber}`}
                            >
                              <JazzMedalIcon medal="NONE" size="sm" />
                            </span>
                          );
                        }

                        return (
                          <button
                            key={`earned-medal-${lesson.classNumber}`}
                            type="button"
                            className={`group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/5 transition-[transform,box-shadow,background-color] duration-200 focus-visible:scale-105 ${
                              activeMedalTooltip === `lesson-${lesson.classNumber}`
                                ? 'z-30 scale-[1.22] bg-white/12 shadow-[0_14px_28px_rgba(15,23,42,0.42)] animate-medal-hover-wobble'
                                : 'hover:scale-[1.16]'
                            }`}
                            onMouseEnter={() => setActiveMedalTooltip(`lesson-${lesson.classNumber}`)}
                            onMouseLeave={() => setActiveMedalTooltip((current) => (current === `lesson-${lesson.classNumber}` ? null : current))}
                            onFocus={() => setActiveMedalTooltip(`lesson-${lesson.classNumber}`)}
                            onBlur={() => setActiveMedalTooltip((current) => (current === `lesson-${lesson.classNumber}` ? null : current))}
                            onClick={() => setActiveMedalTooltip((current) => (current === `lesson-${lesson.classNumber}` ? null : `lesson-${lesson.classNumber}`))}
                            aria-label={`${copy.medalTooltipPrefix} ${lesson.title}`}
                            data-testid={`profile-medal-slot-${lesson.classNumber}`}
                          >
                            <JazzMedalIcon medal={lesson.medal} size="sm" />
                            {activeMedalTooltip === `lesson-${lesson.classNumber}` ? (
                              <span
                                className="pointer-events-none absolute left-1/2 top-0 z-40 w-max max-w-[13rem] -translate-x-1/2 -translate-y-[118%] rounded-2xl border border-white/15 bg-slate-950/95 px-4 py-2 text-center text-[12px] font-semibold leading-5 text-white shadow-[0_20px_40px_rgba(2,6,23,0.52)] backdrop-blur-md before:absolute before:-inset-2 before:-z-10 before:rounded-[1.15rem] before:bg-slate-950/72 before:blur-xl"
                                role="tooltip"
                              >
                                {lesson.title}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex justify-center" data-testid="profile-supreme-only">
                      <button
                        type="button"
                        onMouseEnter={() => setActiveMedalTooltip('supreme')}
                        onMouseLeave={() => setActiveMedalTooltip((current) => (current === 'supreme' ? null : current))}
                        onFocus={() => setActiveMedalTooltip('supreme')}
                        onBlur={() => setActiveMedalTooltip((current) => (current === 'supreme' ? null : current))}
                        onClick={() => {
                          setActiveMedalTooltip((current) => (current === 'supreme' ? null : 'supreme'));
                          router.push('/dashboard/jazz-specialist');
                        }}
                        className={`group relative inline-flex h-16 w-16 items-center justify-center rounded-full border border-yellow-300/30 bg-yellow-300/10 transition-[transform,box-shadow,background-color] duration-200 focus-visible:scale-105 ${
                          activeMedalTooltip === 'supreme'
                            ? 'z-30 scale-[1.16] bg-yellow-300/16 shadow-[0_16px_34px_rgba(250,204,21,0.25)] animate-medal-hover-wobble'
                            : 'hover:scale-[1.1]'
                        }`}
                        aria-label={copy.supremeTitle}
                        data-testid="profile-supreme-medal"
                      >
                        <JazzSupremeMedal language={language} size="sm" />
                        {activeMedalTooltip === 'supreme' ? (
                          <span
                            className="pointer-events-none absolute left-1/2 top-0 z-40 w-max max-w-[13rem] -translate-x-1/2 -translate-y-[112%] rounded-2xl border border-yellow-300/35 bg-slate-950/95 px-4 py-2 text-center text-[12px] font-semibold leading-5 text-yellow-100 shadow-[0_20px_40px_rgba(2,6,23,0.52)] backdrop-blur-md before:absolute before:-inset-2 before:-z-10 before:rounded-[1.15rem] before:bg-slate-950/72 before:blur-xl"
                            role="tooltip"
                          >
                            {copy.supremeTitle}
                          </span>
                        ) : null}
                      </button>
                    </div>
                  )}

                  <div className="mt-4 text-center text-xs text-muted-foreground">
                    <span>{medalProgress?.hasSupremeMedal ? copy.supremeUnlocked : copy.supremeLocked}</span>
                  </div>

                  {medalProgress?.hasSupremeMedal ? (
                    <div className="mt-4 flex justify-center">
                      <Button
                        type="button"
                        onClick={() => router.push('/dashboard/jazz-specialist')}
                        className="rounded-xl bg-yellow-400 text-black hover:bg-yellow-300"
                      >
                        {copy.openSupremePage}
                      </Button>
                    </div>
                  ) : null}
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
                {loading ? copy.saving : copy.saveChanges}
              </Button>
              {success && (
                <span className="text-sm text-green-500 font-medium text-center">{copy.profileUpdated}</span>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">{copy.profileInfo}</h2>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1.5">
                {copy.fullName}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                placeholder={copy.fullNamePlaceholder}
              />
            </div>

            <div>
              <label htmlFor="headline" className="block text-sm font-medium text-foreground mb-1.5">
                {copy.headline}
              </label>
              <input
                id="headline"
                name="headline"
                type="text"
                value={formData.headline}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                placeholder={copy.headlinePlaceholder}
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1.5">
                {copy.bio}
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none"
                placeholder={copy.bioPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{copy.email}</label>
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
                {copy.contactData}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                    {copy.phone}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder={copy.phonePlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground mb-1.5">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {copy.birthDate}
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
                    {copy.city}
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder={copy.cityPlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-foreground mb-1.5">
                    {copy.country}
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    placeholder={copy.countryPlaceholder}
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {copy.paymentMethods}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {copy.paymentMethodsDesc}
              </p>
              <Button
                type="button"
                onClick={handleManagePayments}
                disabled={isSupportLoading}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSupportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wallet className="h-4 w-4 mr-2" />
                )}
                {copy.managePaymentMethods}
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
              <h2 className="text-lg font-semibold text-foreground">{copy.chooseAvatarStyle}</h2>
              <p className="text-sm text-muted-foreground">{copy.chooseAvatarDesc}</p>
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
                {copy.randomAvatarOption}
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
                      alt={copy.avatarOptionAlt}
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
                {copy.cancel}
              </Button>
              <Button type="button" onClick={confirmAvatarSelection}>
                {copy.confirmAvatar}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
