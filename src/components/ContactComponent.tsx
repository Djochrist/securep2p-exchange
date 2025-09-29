import React, { useState } from 'react';
interface ContactComponentProps {
  setActiveTab: React.Dispatch<React.SetStateAction<'dashboard' | 'wallet' | 'messaging' | 'network' | 'settings' | 'contacts'>>;
}

const developers = [
  {
    name: 'Djochrist Kuma-Kuma',
    img: new URL('../assets/djochrist.jpg', import.meta.url).href,
    details: {
      profil: "Étudiant en informatique à l’Université de Lubumbashi, passionné par les innovations technologiques de pointe et les paradigmes émergents du numérique, je préside avec fierté le Cercle Scientifique Math-Info et officie comme ambassadeur de prestigieux programmes académiques. Animé par une curiosité insatiable et un engagement intellectuel sans compromis, je m’investis pleinement dans les communautés scientifiques, œuvrant pour la diffusion du savoir et la promotion d’une culture scientifique éclairée",
      parcours: [
        "Diplôme d’État en Math-Physique",
        "Actuellement étudiant en Informatique à l’Université de Lubumbashi"
      ],
      realisations: ["Développement de plusieurs projets, dont une IA pour le trading"],
      competences: ["C/C++", "Python", "HTML", "CSS", "JavaScript", "Typescript", "React", "Flutter", "SDL2", "PostgreSQL"],
      centresInteret: ["Intelligence artificielle", "Blockchain", "Trading", "Cybersécurité", "Développement bas niveau", "Algorithmie", "Statistique"]
    }
  },
  {
    name: 'Michael Losinu',
    img: new URL('../assets/michael.jpg', import.meta.url).href,
    details: {
      profil: "Je suis un étudiant en informatique passionné par la technologie, la programmation et l’innovation. Curieux et motivé, j’accorde une grande importance à la rigueur et à la fiabilité dans mon travail. Mon parcours atypique, débuté en commerce et gestion, m’a donné une solide base organisationnelle avant de me spécialiser en informatique, un domaine dans lequel je souhaite exceller et bâtir ma carrière.",
      parcours: [
        "Diplôme d’État en Commerce et Gestion",
        "Actuellement en Bac+2 Informatique",
        "Première expérience professionnelle à travers un stage local en informatique"
      ],
      competences: [
        "Langages de programmation : C, Java, HTML, CSS, JavaScript (langage de prédilection)",
        "Frameworks et outils : React, Flutter, SDL2, PostgreSQL",
        "Python : utilisé ponctuellement pour des projets spécifiques (OCR, IA, traitement d’images)"
      ],
      realisations: [],
      centresInteret: [
        "Cybersécurité",
        "Intelligence artificielle",
        "Data science (TensorFlow.js, D3.js)",
        "E-commerce et applications mobiles",
        "Systèmes intelligents"
      ]
    }
  },
  {
    name: 'Carrel Kime',
    img: new URL('../assets/carrel.jpg', import.meta.url).href,
    details: {
      profil: "Étudiant en informatique à l’Université de Lubumbashi, actuellement en Bac+2, après un parcours en Commercialisation et Gestion aux humanités. Passionné par la technologie, l’innovation, l’intelligence artificielle et les bases de données, je me forme chaque jour pour atteindre mes ambitions dans le développement web et le design numérique.",
      parcours: [
        "Commercialisation et Gestion aux Humanités",
        "Bac+2 en Informatique – Université de Lubumbashi"
      ],
      competences: [
        "Développement Web Front-End : HTML, CSS, JavaScript",
        "Programmation : C, Python",
        "Design : création de visuels et maquettes pour projets académiques et professionnels"
      ],
      realisations: [
        "Designer officiel du Cercle Scientifique MatInfo",
        "Designer indépendant pour divers projets graphiques",
        "Participation à des activités de sensibilisation et de vulgarisation scientifique au sein du cercle"
      ],
      contact: {
        email: "Carrelkime@gmail.com",
        telephone: "0990280248"
      }
    }
  }
];

const ContactComponent: React.FC<ContactComponentProps> = ({ setActiveTab }) => {
  const [selectedDev, setSelectedDev] = useState<typeof developers[0] | null>(null);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">Contacts</h2>

      {/* Grille des photos et noms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {developers.map(dev => (
          <div
            key={dev.name}
            onClick={() => setSelectedDev(dev)}
            className="cursor-pointer bg-white rounded-lg shadow p-4 flex flex-col items-center hover:shadow-lg transition"
          >
            <img
              src={dev.img}
              alt={dev.name}
              className="w-32 h-32 rounded-full object-cover border border-gray-300 mb-4"
            />
            <div className="font-semibold text-gray-900 text-lg">{dev.name}</div>
          </div>
        ))}
      </div>

      {/* Modal pour détails */}
      {selectedDev && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative overflow-y-auto max-h-[80vh]">
            <button
              onClick={() => setSelectedDev(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold"
            >
              ✕
            </button>
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={selectedDev.img}
                alt={selectedDev.name}
                className="w-40 h-40 rounded-full object-cover border border-gray-300"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{selectedDev.name}</h3>
                <p className="mb-4">{selectedDev.details.profil}</p>

                <h4 className="font-semibold mt-2">Parcours académique</h4>
                <ul className="list-disc list-inside mb-2">
                  {selectedDev.details.parcours.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>

                {selectedDev.details.realisations.length > 0 && (
                  <>
                    <h4 className="font-semibold mt-2">Réalisations</h4>
                    <ul className="list-disc list-inside mb-2">
                      {selectedDev.details.realisations.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                <h4 className="font-semibold mt-2">Compétences techniques</h4>
                <p>{selectedDev.details.competences.join(", ")}</p>

                <h4 className="font-semibold mt-2">Centres d’intérêt</h4>
                <p>{selectedDev.details.centresInteret?.join(", ")}</p>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactComponent;
