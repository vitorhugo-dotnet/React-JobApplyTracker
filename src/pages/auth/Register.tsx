import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ErrorNote, Spinner } from '@/components/ui/feedback'
import { useAuthStore } from '@/store/authStore'
import { AuthShell, authErrorMessage } from './AuthShell'

interface RegisterForm {
  name: string
  email: string
  password: string
  acceptedPrivacyPolicy: boolean
}

export default function Register() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: { name: '', email: '', password: '', acceptedPrivacyPolicy: false },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      const { accessToken, user } = await registerApi({
        name: values.name,
        email: values.email,
        password: values.password,
        acceptedPrivacyPolicy: values.acceptedPrivacyPolicy,
      })
      setSession(accessToken, user)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(authErrorMessage(error, 'Could not create your account.'))
    }
  })

  return (
    <AuthShell
      title="Create account"
      subtitle="Start tracking your job hunt in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-mono-1 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {submitError && <ErrorNote message={submitError} />}

        <Field label="Full name" htmlFor="name" required error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jordan Diaz"
            aria-invalid={!!errors.name}
            {...register('name', { required: 'Name is required' })}
          />
        </Field>

        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register('email', { required: 'Email is required' })}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          required
          hint="at least 8 characters"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Use at least 8 characters' },
            })}
          />
        </Field>

        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border border-mono-border bg-mono-bg accent-mono-1 cursor-pointer"
              aria-invalid={!!errors.acceptedPrivacyPolicy}
              {...register('acceptedPrivacyPolicy', {
                validate: (v) => v || 'You must accept the Privacy Policy to continue',
              })}
            />
            <span className="text-sm text-mono-2 leading-snug">
              I have read and agree to the{' '}
              <Link
                to="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-mono-1 underline hover:opacity-70"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptedPrivacyPolicy && (
            <p className="text-xs text-red-500 pl-7">{errors.acceptedPrivacyPolicy.message}</p>
          )}
        </div>

        <Button type="submit" variant="primary" disabled={isSubmitting} className="justify-center">
          {isSubmitting ? <Spinner className="border-white/40 border-t-white" /> : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
