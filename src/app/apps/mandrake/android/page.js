import Header from '@/components/Header'; 
import Footer from '@/components/Footer';

export default function Android(){
  return (
    <>
      <Header/>
      <main className="pb-10">
        <div className="card p-6 mt-2">
          <h2 className="text-2xl font-extrabold">Mandrake — Android</h2>
          <ul className="list-disc pl-6 mt-2">
            <li><a className="underline" href="/apps/mandrake/privacy-policy">Privacy Policy</a></li>
            <li><a className="underline" href="/apps/mandrake/terms-of-service">Terms of Service</a></li>
            <li><a className="underline" href="/apps/mandrake/data-deletion">Data Deletion</a></li>
          </ul>
        </div>
      </main>
      <Footer/>
    </>
  )
}
