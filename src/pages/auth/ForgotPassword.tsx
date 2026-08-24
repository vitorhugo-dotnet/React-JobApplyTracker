import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { forgotPassword } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ErrorNote, Spinner } from '@/components/ui/feedback'
import { AuthShell, authErrorMessage } from './AuthShell'

interface ForgotForm {
  email: string
}

export default function ForgotPassword() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    setSubmitError(null)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (error) {
      setSubmitError(authErrorMessage(error, 'Could not send the reset email.'))
    }
  })

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a link to set a new password."
      footer={
        <Link to="/login" className="font-medium text-mono-1 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded border border-mono-e5 bg-mono-f5 px-4 py-3 text-[13px] text-mono-2">
          If an account exists for that email, a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {submitError && <ErrorNote message={submitError} />}
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
          <Button type="submit" variant="primary" disabled={isSubmitting} className="justify-center">
            {isSubmitting ? <Spinner className="border-mono-5 border-t-mono-w" /> : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
