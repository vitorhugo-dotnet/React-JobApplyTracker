import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { loginWithPasskey, isPasskeySupported } from '@/api/passkey'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ErrorNote, Spinner } from '@/components/ui/feedback'
import { useAuthStore } from '@/store/authStore'
import { AuthShell, authErrorMessage } from './AuthShell'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [passkeyBusy, setPasskeyBusy] = useState(false)
  const passkeySupported = isPasskeySupported()

  const emailRef = useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } })

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'

  const { ref: emailRhfRef, ...emailRegister } = register('email', { required: 'Email is required' })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      const { accessToken, user } = await login(values)
      setSession(accessToken, user)
      navigate(from, { replace: true })
    } catch (error) {
      setSubmitError(authErrorMessage(error, 'Invalid email or password.'))
    }
  })

  const onPasskey = async () => {
    setSubmitError(null)
    const email = getValues('email').trim()
    if (!email) {
      emailRef.current?.focus()
      emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setSubmitError('Enter your email address above, then sign in with a passkey.')
      return
    }
    setPasskeyBusy(true)
    try {
      const result = await loginWithPasskey(email)
      if (!result) {
        setSubmitError('No passkey is registered for this account.')
        return
      }
      setSession(result.accessToken, result.user)
      navigate(from, { replace: true })
    } catch (error) {
      // A cancelled WebAuthn prompt rejects with a DOMException — stay silent.
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
        return
      }
      setSubmitError(authErrorMessage(error, 'Could not sign in with a passkey.'))
    } finally {
      setPasskeyBusy(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back — let's get to your pipeline."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-mono-1 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {submitError && <ErrorNote message={submitError} />}

        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...emailRegister}
            ref={(el) => {
              emailRhfRef(el)
              emailRef.current = el
            }}
          />
        </Field>

        <Field label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password', { required: 'Password is required' })}
          />
        </Field>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-[12.5px] text-mono-9 hover:text-mono-1">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" disabled={isSubmitting} className="justify-center">
          {isSubmitting ? <Spinner className="border-mono-5 border-t-mono-w" /> : 'Sign in'}
        </Button>

        {passkeySupported && (
          <>
            <div className="flex items-center gap-3 text-[11.5px] uppercase tracking-wider text-mono-9">
              <span className="h-px flex-1 bg-mono-e5" />
              or
              <span className="h-px flex-1 bg-mono-e5" />
            </div>
            <Button
              type="button"
              onClick={onPasskey}
              disabled={passkeyBusy}
              className="justify-center"
            >
              {passkeyBusy ? <Spinner /> : 'Sign in with a passkey'}
            </Button>
          </>
        )}
      </form>
    </AuthShell>
  )
}
