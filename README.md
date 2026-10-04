# Satisfying Factory

Moteur de vidéos verticales entièrement procédurales, en TypeScript strict, React et Remotion. Chaque générateur produit une configuration validée à partir d'une seed. Les images, mouvements et sons sont calculés par le code ; aucun clip ni bruitage téléchargé n'est nécessaire.

Le MVP comprend **BallDrop**, **GridFill**, **PerfectLoop**, une synthèse audio PCM, un CLI, le rendu MP4, les miniatures, les métadonnées, les batches et le contrôle qualité.

## Installation

- Node.js **22.13+** ou 24+ ; pnpm **10**.
- Un environnement capable de lancer Chromium. Au premier rendu, Remotion télécharge Chrome Headless Shell si nécessaire. Une connexion Internet est donc nécessaire à l'installation et éventuellement au premier rendu.
- Remotion fournit les binaires de traitement vidéo : aucune installation séparée de FFmpeg n'est requise par le CLI.

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm lint
```

Toutes les versions directes sont fixées et `pnpm-lock.yaml` est versionné. Les paquets `remotion` et `@remotion/*` doivent toujours être mis à jour ensemble. `esbuild` est le seul paquet autorisé à exécuter son script d'installation.

Vous pouvez copier `.env.example` vers `.env` pour définir `REMOTION_BROWSER_EXECUTABLE`. Le CLI charge ce fichier avec l'API standard de Node. Les tokens et sorties ne doivent pas être commités. L'utilisation professionnelle de Remotion est soumise à sa [licence](https://www.remotion.dev/license).

## Première vidéo

```sh
pnpm factory list
pnpm factory render ball-drop --seed 42
pnpm factory render grid-fill --seed 42
pnpm factory render perfect-loop --seed 42
pnpm factory validate out/videos
```

Un rendu écrit trois fichiers :

```text
out/videos/ball-drop-42.mp4
out/thumbnails/ball-drop-42.jpg
out/metadata/ball-drop-42.json
```

Les fichiers existants sont protégés. Pour reproduire un rendu en remplaçant explicitement ses sorties :

```sh
pnpm factory render ball-drop --seed 42 --force
```

## Presets et variantes

| Preset | Dimensions | FPS | CRF |
| --- | --- | --- | --- |
| `tiktok` (défaut) | 1080 × 1920 | 60 | 18 |
| `fast-preview` | 360 × 640 | 30 | 26 |
| `high-quality` | 1080 × 1920 | 60 | 14 |

Le format de sortie est MP4, H.264, yuv420p, BT.709, avec AAC si l'audio est activé. La durée naturelle des générateurs est de 6 à 12 secondes. Une durée personnalisée recalcule toute la chronologie visuelle et sonore.

```sh
pnpm factory render perfect-loop --seed 4882 --preset high-quality
pnpm factory render grid-fill --seed 123 --preset fast-preview --duration 4 --fps 30
pnpm factory render ball-drop --seed 42 --variants 5 --output out/variants
pnpm factory render grid-fill --seed 99 --no-audio --no-captions --hashtags art,satisfying
```

`--variants N` conserve la seed initiale pour la première vidéo et calcule N−1 seeds distinctes avec un fork déterministe. Captions et hashtags sont des métadonnées, sans texte superposé à l'animation. `--hashtags ""` désactive les hashtags.

## Remotion Studio

```sh
pnpm studio
pnpm factory preview ball-drop --seed 42
pnpm factory preview perfect-loop --seed 999 --preset fast-preview
```

Studio et le renderer utilisent les mêmes composants et les mêmes configurations. `factory preview` ouvre une session indépendante avec uniquement la composition choisie, avec les props écrites dans `generated/previews/`. Utilisez `--port 3001` si un Studio est déjà ouvert et `--no-open` pour ne pas ouvrir automatiquement le navigateur.

Avec `pnpm studio`, le panneau Inspector permet de modifier les props, de changer les couleurs et de consulter la timeline audio. Avec `factory preview`, les props du fichier `generated/previews/<generator>.json` sont prioritaires : modifiez ce fichier pour changer la configuration, Studio surveille ses changements. Les schémas Zod refusent les configurations incohérentes : si les dimensions de grille changent, son tableau `order` doit rester une permutation de toutes les cellules et sa durée doit permettre de terminer l'animation. Changer seulement le champ `seed` dans une configuration existante ne régénère pas ses autres paramètres ; utilisez `factory preview --seed ...` pour une nouvelle variation.

Les compositions étant enregistrées depuis le registry, Remotion ne peut pas réécrire automatiquement leurs `defaultProps` dans le code. Les modifications de Studio restent en mémoire. Pour conserver une variation, recopiez la valeur de `config` depuis l'éditeur JSON dans une recette ou un fichier de configuration et utilisez `--config`.

## Configurations et recettes

```sh
pnpm factory generate ball-drop --seed 42
pnpm factory generate grid-fill --seed 123 --variants 10
pnpm factory render ball-drop --config generated/configs/ball-drop-42.json --force
pnpm factory preview ball-drop --config generated/configs/ball-drop-42.json
```

`generate` écrit une recette contenant la version du schéma, l'identifiant et la version du générateur, la seed, la configuration complète et les réglages vidéo. `--config` accepte une recette ou un objet de configuration brut. Pour une recette, les réglages sauvegardés sont conservés ; `--preset`, `--fps` et `--duration` permettent de les remplacer. Si `--seed` est fourni avec `--config`, les deux seeds doivent correspondre.

## Batches

```sh
pnpm factory batch --count 10
pnpm factory batch --generator grid-fill --count 25 --seed 123
pnpm factory batch --generator random --count 100 --seed 999
pnpm factory batch --count 50 --weights presets/weights.example.json
pnpm factory batch --count 20 --variants 4 --preset fast-preview
```

Un batch prépare des seeds uniques, choisit les générateurs avec le PRNG, valide et compare les configurations, synthétise l'audio, rend chaque vidéo puis contrôle sa sortie. Il réutilise **un seul bundle et un seul navigateur** pour tout le batch. Les vidéos sont traitées séquentiellement ; `--concurrency` règle le nombre de workers d'images Chromium par vidéo, avec un défaut prudent de 2 et une limite de 8.

```text
out/
  videos/000001.mp4
  thumbnails/000001.jpg
  metadata/000001.json
  manifests/batch-<date>-000001.json
```

La numérotation reprend après les fichiers déjà présents, y compris les métadonnées et miniatures. `--force` autorise les remplacements mais ne remet pas la numérotation d'un batch à zéro. Un verrou interdit deux batches simultanés dans le même dossier de sortie ; des verrous par vidéo protègent également les rendus individuels.

Les manifests sont enregistrés après chaque résultat. Un échec de vidéo est enregistré et le batch continue. Le CLI retourne un code non nul si le batch est partiel ou échoue. Après un arrêt brutal, vérifiez que le processus a cessé avant de supprimer `out/.factory-batch.lock` ou un fichier `out/metadata/*.json.lock` restant. Les sorties temporaires et les WAV en cache peuvent être supprimés quand aucun rendu ne tourne.

Les poids sont un objet JSON `{ "ball-drop": 2, "grid-fill": 1, "perfect-loop": 3 }`. Un poids omis vaut 0 quand un fichier de poids est fourni ; sans fichier, les poids valent tous 1. Dans un batch, `--variants N` garde le générateur choisi pendant N vidéos, sans modifier le nombre total demandé par `--count`.

## Déterminisme

`createRandom(seed)` utilise Mulberry32. `fork(namespace)` dérive un flux indépendant avec FNV-1a ; son résultat ne dépend pas du nombre de tirages déjà effectués dans le parent. Les helpers disponibles sont `float`, `int`, `boolean`, `pick`, `shuffle`, `weighted` et `fork`.

La même combinaison générateur + seed + code produit les mêmes paramètres et le même WAV PCM. Les métadonnées enregistrent `generatorVersion`, `engineVersion`, le SHA-256 des sources et du lockfile (`codeHash`) et le hash canonique de la configuration. Les dates, chemins de sortie et encodages MP4 peuvent varier : le déterminisme promis porte sur la configuration et la synthèse, pas sur les octets d'un MP4 entre systèmes différents.

PerfectLoop utilise `frame / durationInFrames` modulo 1, des harmoniques entières et des fonctions périodiques. L'image virtuelle au frame N est identique à celle du frame 0. Le MP4 contient les frames 0 à N−1 pour préserver un pas de mouvement régulier à la jonction, sans répéter la frame de départ.

## Audio

Les timelines prennent la forme `{ frame, sound, pitch, gain }`. Le mixeur calcule des oscillateurs et du bruit déterministe à 48 kHz, applique des enveloppes et normalise les pics avant d'encoder un WAV PCM mono 16 bits. Les queues sonores peuvent être repliées au début d'une boucle. Le cache est adressé par le hash de la timeline, des réglages et de la version du synthétiseur dans `generated/cache/audio/`.

Le rendu fournit le WAV en data URI à Remotion. Studio utilise le même synthétiseur dans le navigateur et recalcule la piste lorsque les props changent. Il n'y a aucun asset audio distant.

## Validation et tests

```sh
pnpm check
pnpm test:integration
pnpm factory validate out/videos
pnpm factory validate out/videos/perfect-loop-42.mp4
```

`pnpm test` reste une suite unitaire rapide. Elle couvre le PRNG, les configurations sur plusieurs seeds, les sept parcours de grille, les boucles et leurs vitesses, la synthèse WAV, le CLI, les poids, la similarité, les noms de fichiers, les manifests et les erreurs de batch. `test:integration` effectue de vrais rendus courts des trois générateurs depuis un même bundle, dans un dossier temporaire.

Le contrôle qualité vérifie l'existence et la taille du MP4, ses dimensions, sa durée, son FPS, son codec, sa piste audio, ses métadonnées, son hash et la validité de sa configuration. La commande `validate` exige aussi la miniature. Les checks supplémentaires peuvent être injectés dans `validateOutput` pour ajouter une détection d'images noires, de doublons ou une comparaison visuelle de boucle. La lecture vidéo est isolée dans `validate-output.ts` ; elle utilise l'API de métadonnées fournie par Remotion 4, qui devra être remplacée lors d'une migration vers Remotion 5.

`configurationSimilarity` ignore la seed et compare les paramètres. Un batch rejette une configuration dont le score dépasse `--similarity-threshold` (0.985 par défaut), avec 300 tentatives maximum. Ce premier filtre mesure la proximité des paramètres ; il ne remplace pas une comparaison perceptuelle des images.

## Organisation et nouveau générateur

```text
src/
  audio/          Synthèse pure, timeline, validation et cache Node
  analytics/      Schéma optionnel de métriques fournies explicitement
  cli/            Arguments, commandes et lancement Studio
  components/     Scène SVG commune
  config/         Presets et réglages vidéo
  engine/         PRNG, maths de boucle, palette, registry et fichiers
  generators/     BallDrop, GridFill, PerfectLoop et registry central
  metadata/       Captions, recettes et schémas de manifests
  physics/        Contrat de simulation et précalcul à pas temporel fixe
  quality/        Comparaison de configurations
  remotion/       Entrée, compositions dynamiques et props
  render/         Session, vidéo, miniature, batch et validation
  types/          Contrat générateur et schémas communs
presets/          Exemple de poids de sélection
tests/            Tests unitaires ; integration/ pour les vrais rendus
generated/        Recettes, props de preview et cache (ignorés par Git)
out/              Artifacts de rendu (ignorés par Git)
```

Pour ajouter un générateur :

1. Créer `src/generators/<id>/schema.ts`, `generate.ts`, `<Component>.tsx` et `index.ts`.
2. Définir un schéma Zod qui étend `baseConfigSchema`, puis une fonction pure `generate(seed)` utilisant le PRNG.
3. Créer un composant React qui calcule chaque image à partir de `useCurrentFrame()` et `useVideoConfig()`. Les coordonnées SVG sont exprimées dans l'espace de conception de `Scene`, indépendant de la résolution d'encodage.
4. Exporter `defineGenerator({ id, name, version, schema, generate, getDuration, getMetadata, getAudio, Component })`.
5. Ajouter cet export dans `src/generators/index.ts`. Studio, `list`, `render` et `batch` le découvrent automatiquement.
6. Ajouter les tests propres au concept et incrémenter sa version si le comportement procédural change.

Le pipeline de batch ne connaît aucun détail de BallDrop, GridFill ou PerfectLoop.

## Extensions prévues

Le contrat `PhysicsSimulation` et `precalculateSimulation` préparent `simulate(config) => FrameState[]` avec un pas temporel fixé et une seed. Le helper vérifie qu'il existe exactement un état par frame ; le composant lira ensuite `simulation[frame]`. Les simulations ne doivent jamais dépendre de la vitesse réelle d'exécution. Une intégration 3D ou Blender restera dans son générateur/adaptateur et partagera le registry, les presets et les manifests. Three.js, React Three Fiber, Rapier et Python ne sont pas installés dans ce MVP.

TikTok reste désactivé et indépendant du moteur. Il n'y a aucun upload ou publication automatique. Avant une future implémentation, vérifier la documentation officielle Content Posting API, séparer auth/client/creator-info/upload/direct-post, récupérer les capacités du créateur et exiger son consentement de publication. Les restrictions d'audit devront être respectées ; aucun token ne devra entrer dans Git.

Le champ optionnel `analytics` d'un manifest accepte des données validées par `analyticsSnapshotSchema` : vues, likes, commentaires, partages, temps moyen de visionnage en secondes, completion rate entre 0 et 1, dates d'observation et de publication, et provenance `manual` ou `authorized-api`. Les champs inconnus restent absents. Ces métriques sont ainsi associées à l'ID et au `configHash` d'une vidéo. Aucun collecteur n'est implémenté ; une future ingestion utilisera exclusivement des données explicitement fournies ou une API autorisée, sans scraping.
