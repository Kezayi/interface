export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">POLITIQUE DE CONFIDENTIALITÉ</h1>
          <p className="text-xl text-gray-600 mb-6">Plateforme FLOORENCE</p>
          <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : [à compléter]</p>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">1. PRÉAMBULE — PHILOSOPHIE DE LA DONNÉE</h2>
              <p className="mb-3">
                FLOORENCE est une infrastructure mémorielle numérique.<br />
                À ce titre, la donnée qui y transite n'est pas une donnée d'usage ordinaire, mais une trace humaine liée au
                deuil, à la mémoire et aux relations sociales.
              </p>
              <p className="mb-3">FLOORENCE adopte un principe simple et strict :</p>
              <p className="mb-3 font-medium">Toute donnée collectée doit être nécessaire, respectueuse et non exploitée.</p>
              <p>Aucune donnée n'est collectée à des fins publicitaires, commerciales ou de profilage.</p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">2. RESPONSABLE DU TRAITEMENT</h2>
              <p>Le responsable du traitement des données est :</p>
              <p className="mt-2">
                <strong>FLOORENCE</strong><br />
                [Forme juridique / adresse / contact à compléter]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">3. DONNÉES COLLECTÉES</h2>
              <p className="mb-4">FLOORENCE collecte uniquement les données strictement nécessaires à son fonctionnement.</p>

              <h3 className="text-xl font-light text-gray-900 mb-3">3.1 Données liées à l'espace mémoriel</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Nom du défunt</li>
                <li>Dates de naissance et de décès</li>
                <li>Photo(s) du défunt</li>
                <li>Texte de l'avis de décès</li>
                <li>Informations liées au programme des obsèques</li>
                <li>Informations liées à la maison du deuil (adresse, GPS éventuel)</li>
              </ul>
              <p>Ces données sont publiées à l'initiative de l'auteur de l'espace.</p>

              <h3 className="text-xl font-light text-gray-900 mb-3 mt-6">3.2 Données liées aux messages du livre d'or</h3>
              <p className="mb-3">Lors de la publication d'un message de condoléances, les données suivantes sont collectées :</p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>Texte du message</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
                <li>Lien déclaré avec le défunt (menu déroulant)</li>
              </ul>
              <p className="mb-3 font-medium">Ces données personnelles ne sont jamais affichées publiquement.</p>
              <p className="mb-2">Elles sont collectées uniquement pour :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>garantir la traçabilité humaine des messages,</li>
                <li>prévenir les abus,</li>
                <li>permettre un contact en cas de problème technique ou juridique.</li>
              </ul>

              <h3 className="text-xl font-light text-gray-900 mb-3 mt-6">3.3 Données liées aux gestes symboliques</h3>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>Type de geste (RIP, cierge, fleur)</li>
                <li>Quantité associée au message</li>
                <li>Horodatage</li>
              </ul>
              <p>FLOORENCE ne déduit aucune information sociale ou comportementale à partir de ces gestes.</p>

              <h3 className="text-xl font-light text-gray-900 mb-3 mt-6">3.4 Données financières (contributions et gestes payants)</h3>
              <p className="mb-3">Dans le cadre des paiements :</p>
              <p className="mb-3">
                <strong>FLOORENCE ne stocke aucune donnée bancaire sensible</strong> (numéro de carte, code PIN, etc.).
              </p>
              <p className="mb-3">Les paiements sont traités via des prestataires tiers sécurisés (Mobile Money, etc.).</p>
              <p className="mb-2">Les informations conservées par FLOORENCE se limitent à :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>un identifiant de transaction,</li>
                <li>le statut du paiement,</li>
                <li>la date et le montant.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">4. FINALITÉS DU TRAITEMENT</h2>
              <p className="mb-3">Les données collectées sont utilisées exclusivement pour :</p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>permettre la création et la gestion des espaces mémoriels,</li>
                <li>afficher les informations liées aux obsèques,</li>
                <li>permettre l'expression de gestes symboliques,</li>
                <li>assurer la continuité via l'héritier numérique,</li>
                <li>garantir la sécurité, la traçabilité et la résolution d'éventuels litiges.</li>
              </ul>
              <p className="font-medium">
                Aucune donnée n'est utilisée à des fins marketing, publicitaires ou statistiques externes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">5. DONNÉES NON COLLECTÉES (ENGAGEMENT FORMEL)</h2>
              <p className="mb-3">FLOORENCE s'engage à ne jamais collecter :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>des données de navigation à des fins de profilage,</li>
                <li>des données de géolocalisation en temps réel,</li>
                <li>des données sociales croisées entre utilisateurs,</li>
                <li>des données destinées à des tiers commerciaux.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">6. COOKIES ET TRACEURS</h2>
              <p className="mb-3">FLOORENCE utilise uniquement :</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>des cookies strictement nécessaires au fonctionnement technique,</li>
                <li>des cookies de session éventuels.</li>
              </ul>
              <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-1">
                <p>❌ Aucun cookie publicitaire</p>
                <p>❌ Aucun traceur tiers</p>
                <p>❌ Aucun outil de suivi comportemental</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">7. ACCÈS, CONFIDENTIALITÉ ET SÉCURITÉ</h2>

              <h3 className="text-xl font-light text-gray-900 mb-3">7.1 Accès aux données</h3>
              <p className="mb-3">Les données personnelles sont accessibles uniquement :</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>à l'utilisateur concerné,</li>
                <li>à l'auteur de l'espace (dans son périmètre),</li>
                <li>aux administrateurs FLOORENCE strictement habilités.</li>
              </ul>

              <h3 className="text-xl font-light text-gray-900 mb-3">7.2 Sécurité</h3>
              <p className="mb-2">FLOORENCE met en œuvre :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>des mesures techniques de sécurisation,</li>
                <li>des contrôles d'accès stricts,</li>
                <li>des journaux de traçabilité internes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">8. DURÉE DE CONSERVATION</h2>
              <p className="mb-3">Les données sont conservées :</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>aussi longtemps que l'espace mémoriel existe,</li>
                <li>ou jusqu'à suppression sur demande légitime.</li>
              </ul>
              <p className="mb-2">Certaines données techniques peuvent être conservées plus longtemps à des fins :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>légales,</li>
                <li>comptables,</li>
                <li>de sécurité.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">9. DROITS DES UTILISATEURS</h2>
              <p className="mb-3">
                Conformément à la réglementation applicable, chaque utilisateur dispose des droits suivants :
              </p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>droit d'accès,</li>
                <li>droit de rectification,</li>
                <li>droit de suppression,</li>
                <li>droit de limitation du traitement.</li>
              </ul>
              <p>
                Les demandes peuvent être adressées à :<br />
                [email de contact FLOORENCE]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">10. TRANSMISSION DES DONNÉES</h2>
              <p className="mb-3">
                <strong>FLOORENCE ne vend, ne loue et ne cède aucune donnée personnelle à des tiers.</strong>
              </p>
              <p className="mb-2">Les données peuvent être transmises uniquement :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>aux prestataires techniques strictement nécessaires (paiement, hébergement),</li>
                <li>dans le cadre d'obligations légales.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">11. CAS PARTICULIER DE L'HÉRITIER NUMÉRIQUE</h2>
              <p className="mb-2">Les coordonnées de l'héritier numérique :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>sont collectées uniquement pour assurer la continuité de l'espace,</li>
                <li>ne sont jamais affichées publiquement,</li>
                <li>ne sont utilisées qu'en cas d'indisponibilité avérée de l'auteur.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">12. MODIFICATION DE LA POLITIQUE</h2>
              <p className="mb-3">FLOORENCE peut mettre à jour la présente Politique de confidentialité afin de :</p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>se conformer à l'évolution de la loi,</li>
                <li>améliorer la sécurité,</li>
                <li>respecter son manifeste éthique.</li>
              </ul>
              <p>Toute modification substantielle sera portée à la connaissance des utilisateurs.</p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">13. DISPOSITION FINALE</h2>
              <p className="mb-3">
                La mémoire est un bien sensible.<br />
                FLOORENCE traite les données non comme des ressources exploitables, mais comme des traces humaines à protéger.
              </p>
              <p className="text-center mt-6 text-gray-600">FIN DE LA POLITIQUE DE CONFIDENTIALITÉ</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
