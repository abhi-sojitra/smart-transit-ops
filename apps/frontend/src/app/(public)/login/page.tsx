'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { APP_NAME } from '@/constants/nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/forms/form-field';
import { useAuthStore } from '@/store';
import { authApi } from '@/services/auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

const roles = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@transitops.com',
      password: 'Admin@12345',
      remember: true,
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const tokens = await authApi.login(values.email, values.password);
      setTokens(tokens.accessToken, tokens.refreshToken);
      toast.success('Signed in successfully');
      router.push('/dashboard');
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? ((error.response?.data as { message?: string })?.message ?? error.message)
          : 'Unable to sign in';
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.4fr]">
      <aside className="hidden flex-col justify-between bg-slate-100 p-10 text-slate-900 lg:flex dark:bg-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              T
            </span>
            <span className="text-xl font-semibold">{APP_NAME}</span>
          </div>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-slate-600">
            Enterprise fleet & transport operations for teams that move goods with precision,
            safety, and clarity.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Built for roles
          </p>
          <ul className="space-y-2">
            {roles.map((role) => (
              <li
                key={role}
                className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium"
              >
                {role}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex items-center justify-center bg-[#121212] px-6 py-12 text-slate-50">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Use your organization credentials to access TransitOps.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="border-slate-700 bg-slate-900 text-slate-50"
                {...register('email')}
              />
            </FormField>

            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="border-slate-700 bg-slate-900 text-slate-50"
                {...register('password')}
              />
            </FormField>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <Checkbox
                  checked={watch('remember')}
                  onCheckedChange={(checked) => setValue('remember', Boolean(checked))}
                />
                Remember me
              </label>
              <button type="button" className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            {formError ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {formError}
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                Demo: admin@transitops.com / Admin@12345
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
            <Link href="/dashboard" className="hover:text-primary">
              Continue to dashboard
            </Link>
            <button type="button" className="hover:text-primary">
              Contact support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
