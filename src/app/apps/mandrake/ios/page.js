import Header from '@/components/Header'; 
import Footer from '@/components/Footer';

export default function IOS(){
  return (
    <>
      <Header/>
      <main className="pb-10">
        <div className="card p-6 mt-2">
          <h2 className="text-2xl font-extrabold">Mandrake — iOS</h2>
          <ul className="list-disc pl-6 mt-2">
            <li><a className="underline" href="/assets/policies/Mandrake_Privacy_Policy_iOS.pdf">Privacy Policy (iOS)</a></li>
            <li><a className="underline" href="/assets/policies/Mandrake_Terms_of_Service_iOS.pdf">Terms of Service (iOS)</a></li>
            <li><a className="underline" href="/assets/policies/Mandrake_Disclaimer_iOS.pdf">Disclaimer (iOS)</a></li>
          </ul>
        </div>
      </main>
      <Footer/>
    </>
  )
}
