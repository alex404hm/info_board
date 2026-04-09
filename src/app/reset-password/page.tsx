import { Suspense } from "react"
import ResetPasswordForm from "./ResetPasswordForm"

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams
  return (
    <Suspense>
      <ResetPasswordForm token={token ?? null} />
    </Suspense>
  )
}
