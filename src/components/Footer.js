// src/components/Footer.js
import ConsentTrigger from "@/components/ConsentTrigger";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-black/10 text-sm text-muted px-4 py-6 text-center">
      <p>
        © {new Date().getFullYear()} Arcturus Digital Consulting ·{" "}
        <a href="/privacy" className="hover:text-brand underline">
          Privacy
        </a>{" "}
        ·{" "}
        <a href="/terms" className="hover:text-brand underline">
          Terms
        </a>{" "}
        ·{" "}
        <ConsentTrigger className="hover:text-brand underline">
          Cookie preferences
        </ConsentTrigger>
      </p>

      {/* Social links */}
      <div className="mt-3 flex justify-center">
        <Link
          href="https://www.instagram.com/arcturusdigitalconsulting?igsh=MWZuajQ0bHZ2dzJpcQ=="
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:text-pink-500"
        >
          <Image
            src="/img/Instagram_Glyph_Gradient.png"
            alt="Instagram"
            width={20}
            height={20}
            className="rounded-sm"
          />
          <span className="text-sm">Instagram</span>
        </Link>
      </div>
    </footer>
  );
}
