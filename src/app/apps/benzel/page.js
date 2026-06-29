import BenzelReader from "./BenzelReader";

const pages = [
  {
    id: "cover",
    label: "Cover",
    shortLabel: "Cover",
    src: "/img/benzel/cover.jpg",
    width: 1055,
    height: 1491,
  },
  {
    id: "page-01",
    label: "Page 1",
    shortLabel: "1",
    src: "/img/benzel/page-01.jpg",
    width: 1055,
    height: 1491,
  },
  {
    id: "page-02",
    label: "Page 2",
    shortLabel: "2",
    src: "/img/benzel/page-02.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "page-03",
    label: "Page 3",
    shortLabel: "3",
    src: "/img/benzel/page-03.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "page-04",
    label: "Page 4",
    shortLabel: "4",
    src: "/img/benzel/page-04.jpg",
    width: 1055,
    height: 1491,
  },
  {
    id: "page-05",
    label: "Page 5",
    shortLabel: "5",
    src: "/img/benzel/page-05.jpg",
    width: 1055,
    height: 1491,
  },
  {
    id: "page-06",
    label: "Page 6",
    shortLabel: "6",
    src: "/img/benzel/page-06.jpg",
    width: 1024,
    height: 1536,
  },
  {
    id: "page-07",
    label: "Page 7",
    shortLabel: "7",
    src: "/img/benzel/page-07.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "page-08",
    label: "Page 8",
    shortLabel: "8",
    src: "/img/benzel/page-08.jpg",
    width: 1086,
    height: 1448,
  },
];

export const metadata = {
  title: "Benzel - The Night the Fun Went Missing",
  description:
    "A mobile-first comic reader for Benzel: The Night the Fun Went Missing.",
  openGraph: {
    title: "Benzel - The Night the Fun Went Missing",
    description:
      "Read Benzel as a mobile-first comic book with page navigation and page-turn motion.",
    url: "https://www.arcturusdc.com/apps/benzel",
    siteName: "Arcturus Digital Consulting",
    images: [
      {
        url: "https://www.arcturusdc.com/img/benzel/cover.jpg",
        width: 1055,
        height: 1491,
        alt: "Benzel comic cover",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Benzel - The Night the Fun Went Missing",
    description:
      "Read Benzel as a mobile-first comic book with page navigation and page-turn motion.",
    images: ["https://www.arcturusdc.com/img/benzel/cover.jpg"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#081112",
};

export default function BenzelPage() {
  return <BenzelReader pages={pages} />;
}
