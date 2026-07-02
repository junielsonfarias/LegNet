import { redirect } from 'next/navigation'

/**
 * Perfil completo: a página dedicada era um stub (todas as estatísticas zeradas).
 * O perfil real e completo é `/parlamentares/[slug]` (consome /api/parlamentares/
 * [id]/perfil com presença, produção, votações, comissões). Redireciona para lá
 * para não exibir dados vazios. Ver ERR-063.
 */
export default async function PerfilCompletoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/parlamentares/${slug}`)
}
