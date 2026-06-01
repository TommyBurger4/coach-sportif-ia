# Coach Sportif IA

Coach Sportif IA est un tableau de bord local pour planifier, suivre et ajuster un coaching sportif personnel. Il combine une petite webapp, des fichiers de donnees lisibles, et des documents de methode pour qu'un assistant IA puisse prendre de meilleures decisions au fil du temps.

Le projet est volontairement simple: pas de base de donnees, pas de compte utilisateur, pas de cloud obligatoire. Les donnees vivent dans `data/` en JSON et CSV.

## Ce que le projet permet

- definir un profil sportif, des objectifs et des contraintes
- planifier des seances de musculation, sport, course, mobilite et recuperation
- saisir les retours de seance avec RPE, energie, douleurs et notes
- suivre la progression des charges et du poids
- suivre les repas, les macros et un inventaire de frigo/placards
- garder des workflows clairs pour la planification hebdomadaire et les check-ins
- donner a un assistant IA un contexte stable pour coacher une personne differente

## Demarrage rapide

Prerequis: Node.js recent.

```bash
npm run dev
```

Puis ouvrir:

```text
http://127.0.0.1:3130
```

Si le port `3130` est deja utilise:

```bash
PORT=3131 npm run dev
```

## Personnaliser le coach

Les fichiers fournis sont des exemples anonymes. Pour utiliser le coach avec votre propre profil:

1. Modifiez `data/profile.json`.
2. Ajustez `data/nutrition_targets.json`.
3. Remplacez ou videz les exemples CSV dans `data/`.
4. Ajoutez vos seances dans `data/planned_sessions.json`, ou laissez l'assistant IA les generer.
5. Lancez la webapp et enregistrez vos retours apres chaque seance.

Le fichier le plus important est `data/profile.json`. Il contient l'objectif actuel, la periode actuelle, les contraintes, le sport principal, les habitudes et le niveau de depart.

## Structure

```text
app/
  server.js              Serveur local Node.js
  public/                Interface web
data/                    Donnees utilisateur ou exemples anonymes
docs/                    Regles de coaching et architecture de decision
workflows/               Routines de planification et de check-in
templates/               Formats de reponse et de programmation
```

## Donnees

Les donnees sont volontairement stockees dans des formats simples:

- `profile.json`: profil, objectifs, contraintes, contexte
- `planned_sessions.json`: seances prevues
- `workout_history.csv`: historique des seances
- `strength_progression.csv`: progression musculation
- `body_metrics.csv`: poids, bodyfat et mensurations
- `nutrition_log.csv`: repas et macros
- `nutrition_targets.json`: cibles nutritionnelles
- `fridge_inventory.json`: frigo et placards
- `planned_meals.json`: repas prevus
- `running_history.csv`: historique course
- `recovery_log.csv`: mobilite, etirements, recuperation
- `weekly_summaries.json`: syntheses hebdomadaires

## Utilisation avec un assistant IA

Avant de programmer une semaine ou de conseiller une seance, l'assistant doit relire:

1. `data/profile.json`
2. `data/weekly_summaries.json`
3. les historiques pertinents dans `data/`
4. les regles dans `docs/`

La logique centrale est simple: ne pas proposer de programme generique. Toute decision doit tenir compte de l'objectif actuel, de la periode, de la fatigue, des douleurs, de l'historique et des contraintes reelles.

## Vie privee

Ce repo ne doit contenir que des donnees anonymes ou des exemples. Les donnees personnelles reelles doivent rester hors Git, par exemple dans un dossier local ignore comme `.local/`.

Avant de publier ou pousser le repo:

```bash
rg "prenom|nom|email|telephone|adresse|notion|calendar|token|secret|api_key" .
git status --short
```

## Scripts

```bash
npm run dev
```

Lance le dashboard local.

## Licence

Projet personnel reutilisable. Ajoutez une licence si vous souhaitez le publier largement.
