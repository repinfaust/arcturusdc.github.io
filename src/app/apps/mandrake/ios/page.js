import Header from '@/components/Header'; 
import Footer from '@/components/Footer';

export default function IOS(){
  return (
    <>
      <Header/>
      <main className="pb-10">
        <div className="card p-6 mt-2">
          <h2 className="text-2xl font-extrabold">Mandrake — iOS</h2>
          <p className="mt-2">Mandrake is not currently available on iOS.</p>
          <a className="mt-4 inline-block underline" href="/apps/mandrake">Return to Mandrake</a>
        </div>
      </main>
      <Footer/>
    </>
  )
}
