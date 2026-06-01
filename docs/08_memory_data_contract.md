# Memoire Et Donnees Persistantes

## Regle D'alignement

Avant toute lecture detaillee ou decision, identifier dans `data/profile.json` :

- `current_objective`
- `current_period`
- `period_goal`

Si ces champs sont vides ou obsoletes, demander une mise a jour.

## Regle Centrale

Toujours relire les donnees historiques avant toute decision importante.

Le systeme apprend progressivement :

- ce qui marche le mieux
- ce qui fatigue
- ce qui fait progresser
- les horaires optimaux
- les habitudes efficaces

## Fichiers Persistants

### data/profile.json

Source de verite.

Contient :

- profil physique
- objectifs
- historique
- contraintes
- periodes
- materiel
- nutrition
- running
- sport principal

### data/workout_history.csv

Suivi complet de chaque seance.

### data/strength_progression.csv

Progression charges et performances.

### data/body_metrics.csv

Poids, bodyfat, mensurations et progression corporelle.

### data/nutrition_log.csv

Calories, proteines, glucides, lipides et repas.

### data/fridge_inventory.json

Inventaire du frigo.

### data/running_history.csv

Suivi cardio/endurance.

### data/weekly_summaries.json

Synthese exploitable de chaque semaine.

Toujours relire ce fichier avant de planifier une nouvelle semaine, car il resume :

- seances faites
- seances ratees ou deplacees
- signaux de fatigue
- douleurs ou alertes
- decisions a retenir pour la prochaine programmation
- donnees encore a confirmer

## Priorite Des Donnees

1. Donnees utilisateur explicites les plus recentes.
2. `data/profile.json`.
3. Historiques CSV.
4. Hypotheses clairement signalees.

## Donnees Manquantes

Si une donnee importante manque, la demander en respectant la limite de 10 questions maximum.
