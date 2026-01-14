export function CGU() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">CONDITIONS GÉNÉRALES D'UTILISATION</h1>
          <p className="text-xl text-gray-600 mb-6">Plateforme FLOORENCE</p>
          <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : [à compléter]</p>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">1. PRÉAMBULE — NATURE DE FLOORENCE</h2>
              <p className="mb-3">
                FLOORENCE est une infrastructure mémorielle numérique destinée à permettre la publication d'avis de décès,
                l'organisation des informations liées aux obsèques, l'expression de gestes symboliques, et la conservation
                de la mémoire des personnes décédées.
              </p>
              <p className="mb-3">
                <strong>FLOORENCE n'est pas un réseau social.</strong><br />
                Elle ne vise ni la comparaison entre les utilisateurs, ni la captation de l'attention, ni l'exploitation émotionnelle.
              </p>
              <p>L'utilisation de la plateforme implique une posture de respect, tant envers les défunts qu'envers les vivants.</p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">2. ACCEPTATION DES CGU</h2>
              <p className="mb-3">
                L'accès et l'utilisation de FLOORENCE impliquent l'acceptation pleine et entière des présentes Conditions
                Générales d'Utilisation.
              </p>
              <p>
                Toute personne qui accède à un espace mémoriel, publie un message, pose un geste symbolique ou crée un espace
                reconnaît avoir pris connaissance des CGU et s'engage à les respecter.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">3. DÉFINITIONS</h2>
              <ul className="space-y-2 list-none">
                <li><strong>Plateforme :</strong> le service numérique FLOORENCE.</li>
                <li><strong>Espace mémoriel :</strong> page dédiée à une personne décédée.</li>
                <li><strong>Auteur :</strong> personne qui crée un espace mémoriel.</li>
                <li><strong>Héritier numérique :</strong> personne désignée par l'auteur pour assurer la continuité de l'espace en cas d'indisponibilité.</li>
                <li><strong>Utilisateur :</strong> toute personne accédant à la plateforme.</li>
                <li><strong>Gestes symboliques :</strong> RIP, cierges et fleurs virtuels.</li>
                <li><strong>Livre d'or :</strong> espace de messages de condoléances.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">4. TYPES D'ESPACES MÉMORIELS</h2>
              <p className="mb-4">Lors de la création, l'auteur choisit obligatoirement l'un des deux types suivants :</p>

              <h3 className="text-xl font-light text-gray-900 mb-3">4.1 Décès récent (obsèques à venir)</h3>
              <p className="mb-3">Cet espace inclut :</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>un avis de décès,</li>
                <li>la maison du deuil (avec localisation éventuelle),</li>
                <li>le programme des obsèques.</li>
              </ul>

              <h3 className="text-xl font-light text-gray-900 mb-3">4.2 Décès passé (obsèques déjà effectuées)</h3>
              <p className="mb-3">
                Cet espace a une vocation exclusivement mémorielle et d'archivage.<br />
                Il ne comporte ni programme des obsèques ni maison du deuil.
              </p>
              <p>Le type choisi détermine automatiquement les fonctionnalités disponibles.</p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">5. CRÉATION ET ADMINISTRATION D'UN ESPACE</h2>

              <h3 className="text-xl font-light text-gray-900 mb-3">5.1 Auteur unique</h3>
              <p className="mb-3">Chaque espace mémoriel est administré par un seul auteur, responsable :</p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>de l'exactitude des informations publiées,</li>
                <li>des mises à jour éventuelles,</li>
                <li>de l'activation ou non des contributions financières.</li>
              </ul>
              <p className="mb-4">Aucune co-administration n'est possible dans la version actuelle de FLOORENCE.</p>

              <h3 className="text-xl font-light text-gray-900 mb-3">5.2 Héritier numérique</h3>
              <p className="mb-3">Lors de la création de l'espace, l'auteur désigne un héritier numérique (email ou numéro de téléphone).</p>
              <p className="mb-2">L'héritier :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>n'est pas visible publiquement,</li>
                <li>n'intervient qu'en cas d'indisponibilité avérée de l'auteur,</li>
                <li>dispose de droits strictement limités à la gestion factuelle de l'espace.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">6. LIVRE D'OR ET MESSAGES</h2>

              <h3 className="text-xl font-light text-gray-900 mb-3">6.1 Publication</h3>
              <p className="mb-3">Tout message publié dans le livre d'or doit être :</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>respectueux,</li>
                <li>conforme aux usages du deuil,</li>
                <li>exempt de propos diffamatoires, politiques, commerciaux ou haineux.</li>
              </ul>
              <p className="mb-3">Chaque message nécessite obligatoirement :</p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>un texte de condoléances,</li>
                <li>une adresse email,</li>
                <li>un numéro de téléphone,</li>
                <li>la déclaration d'un lien avec le défunt (menu déroulant).</li>
              </ul>
              <p>Ces données ne sont jamais rendues publiques.</p>

              <h3 className="text-xl font-light text-gray-900 mb-3 mt-4">6.2 Modération</h3>
              <p>
                FLOORENCE se réserve le droit de masquer ou supprimer tout contenu manifestement contraire à la dignité du
                défunt ou aux présentes CGU, sans obligation de justification publique.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">7. GESTES SYMBOLIQUES</h2>

              <h3 className="text-xl font-light text-gray-900 mb-3">7.1 RIP</h3>
              <p className="mb-4">Le RIP est un geste symbolique gratuit permettant de marquer une présence ou une pensée.</p>

              <h3 className="text-xl font-light text-gray-900 mb-3">7.2 Cierges et fleurs</h3>
              <p className="mb-3">Les cierges et fleurs sont des gestes symboliques payants :</p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>toujours associés à un message du livre d'or,</li>
                <li>non comparables entre utilisateurs,</li>
                <li>non interprétés par la plateforme.</li>
              </ul>
              <p>FLOORENCE n'attribue aucune valeur sociale, morale ou affective aux gestes posés.</p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">8. CONTRIBUTIONS AUX OBSÈQUES</h2>

              <h3 className="text-xl font-light text-gray-900 mb-3">8.1 Activation</h3>
              <p className="mb-2">Les contributions financières sont :</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>optionnelles,</li>
                <li>activées uniquement par l'auteur de l'espace.</li>
              </ul>

              <h3 className="text-xl font-light text-gray-900 mb-3">8.2 Modalités</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Les fonds sont reversés intégralement à la famille.</li>
                <li>FLOORENCE ne prélève aucune commission sur ces contributions.</li>
                <li>Les frais de paiement sont supportés par l'utilisateur.</li>
              </ul>

              <h3 className="text-xl font-light text-gray-900 mb-3">8.3 Clôture</h3>
              <p>
                Les contributions sont automatiquement désactivées à la date d'inhumation, accompagnées d'un message de
                remerciement automatique.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">9. SUIVI ET NOTIFICATIONS</h2>
              <p className="mb-3">
                Les utilisateurs peuvent suivre un espace mémoriel afin de recevoir des notifications strictement factuelles :
              </p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>publication ou mise à jour du programme,</li>
                <li>rappel de la date d'inhumation.</li>
              </ul>
              <p>Aucune notification émotionnelle, incitative ou commerciale n'est envoyée.</p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">10. DONNÉES PERSONNELLES</h2>
              <p className="mb-3">FLOORENCE collecte uniquement les données strictement nécessaires à son fonctionnement.</p>
              <p className="mb-2">Les données personnelles :</p>
              <ul className="list-disc list-inside mb-3 space-y-1">
                <li>ne sont jamais revendues,</li>
                <li>ne sont jamais utilisées à des fins marketing,</li>
                <li>ne font l'objet d'aucun profilage comportemental.</li>
              </ul>
              <p>
                Chaque utilisateur peut exercer ses droits d'accès, de rectification et de suppression conformément à la
                législation applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">11. RESPONSABILITÉ</h2>
              <p className="mb-3">
                FLOORENCE agit comme plateforme d'hébergement et d'organisation, et non comme éditeur du contenu publié par
                les utilisateurs.
              </p>
              <p className="mb-2">La responsabilité de FLOORENCE ne saurait être engagée en cas :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>d'erreur factuelle fournie par l'auteur,</li>
                <li>de conflit familial ou social autour d'un espace mémoriel,</li>
                <li>d'usage détourné ou abusif par un utilisateur.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">12. ÉVOLUTION DE LA PLATEFORME</h2>
              <p className="mb-3">
                FLOORENCE se réserve le droit de faire évoluer ses fonctionnalités, dans le respect de son manifeste éthique
                et mémoriel.
              </p>
              <p>Aucune évolution ne pourra transformer FLOORENCE en réseau social ou outil de comparaison.</p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">13. DROIT APPLICABLE</h2>
              <p className="mb-3">
                Les présentes CGU sont régies par le droit applicable dans le pays d'exploitation principale de FLOORENCE,
                sous réserve des règles de droit international privé.
              </p>
              <p>Tout litige fera l'objet d'une tentative de résolution amiable avant toute action judiciaire.</p>
            </section>

            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-4">14. DISPOSITION FINALE</h2>
              <p className="mb-3">
                FLOORENCE est un espace de mémoire, de transmission et de respect.<br />
                Son usage implique une responsabilité morale partagée entre la plateforme et ses utilisateurs.
              </p>
              <p className="text-center mt-6 text-gray-600">FIN DES CONDITIONS GÉNÉRALES D'UTILISATION</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
