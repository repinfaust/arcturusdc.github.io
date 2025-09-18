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
            <li><a className="underline" href="/assets/policies/Mandrake_Privacy_Policy_16plus.pdf">Privacy Policy (Android)</a></li>
            <li><a className="underline" href="/assets/policies/Mandrake_Terms_of_Service_16plus.pdf">Terms of Service (Android)</a></li>
            <li><a className="underline" href="/assets/policies/Mandrake_Disclaimer_16plus.pdf">Disclaimer (Android)</a></li>
          </ul>
        </div>
      </main>
      <Footer/>
    </>
  )
}
