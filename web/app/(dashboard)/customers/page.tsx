import { redirect } from 'next/navigation';

export default async function CustomersRedirect(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const params = new URLSearchParams();
  params.set('type', 'customer');

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, val]) => {
      if (key !== 'type' && key !== 'status' && val !== undefined) {
        if (Array.isArray(val)) {
          val.forEach((v) => params.append(key, v));
        } else {
          params.set(key, val);
        }
      }
    });
  }

  const query = params.toString();
  redirect(`/contacts?${query}`);
}

