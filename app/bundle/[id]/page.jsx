import { redirect } from 'next/navigation';

export default async function LegacyBundleRedirect({ params }) {
  const { id } = await params;
  redirect(`/combo/${id}`);
}
