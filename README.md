# Summoner Synergy — Déploiement Vercel

## Structure du projet

```
summoner-synergy/
├── api/
│   ├── account.js      ← endpoint : récupère le PUUID d'un joueur
│   ├── masteries.js    ← endpoint : récupère les maîtrises
│   └── champions.js    ← endpoint : proxy DDragon (noms/icônes)
├── index.html          ← frontend
├── vercel.json         ← configuration Vercel
└── README.md
```

La clé API Riot **n'est jamais dans le code** — elle est stockée dans les
variables d'environnement Vercel, côté serveur uniquement.

---

## Étape 1 — Obtenir une clé API Riot (Production)

> Les clés de *développement* (RGAPI-...) expirent toutes les 24h et ne
> conviennent pas à un site public. Pour un site permanent, il faut soumettre
> un projet.

1. Va sur https://developer.riotgames.com
2. Connecte-toi avec ton compte League of Legends
3. Clique sur **"Submit a Product Registration"**
4. Choisis **"Personal Project"** (usage non-commercial, gratuit)
5. Remplis le formulaire : nom du projet, description, utilisation des données
6. Une fois approuvé (quelques jours), tu reçois une **Production API Key**
   qui ne expire pas

En attendant l'approbation, tu peux tester en local avec ta clé de
développement (voir Étape 4).

---

## Étape 2 — Mettre le projet sur GitHub

1. Crée un compte sur https://github.com si tu n'en as pas
2. Crée un **nouveau dépôt** (repository), ex: `summoner-synergy`
3. Mets-le en **Privé** (recommandé — même si la clé n'est pas dans le code)
4. Upload tous les fichiers de ce dossier :
   - Glisse-dépose les fichiers sur la page GitHub du dépôt, OU
   - Utilise Git en ligne de commande :
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/TON_USERNAME/summoner-synergy.git
     git push -u origin main
     ```

---

## Étape 3 — Déployer sur Vercel

1. Va sur https://vercel.com et crée un compte (gratuit, connexion via GitHub)
2. Clique **"Add New Project"**
3. Sélectionne ton dépôt `summoner-synergy`
4. Vercel détecte automatiquement la config — clique **"Deploy"**
5. Ton site est en ligne sur une URL du type :
   `https://summoner-synergy-xxx.vercel.app`

---

## Étape 4 — Configurer la clé API Riot sur Vercel

C'est l'étape cruciale — sans ça, le site répond "RIOT_API_KEY non configurée".

1. Dans le dashboard Vercel, va dans ton projet
2. Clique **Settings** → **Environment Variables**
3. Ajoute une variable :
   - **Name** : `RIOT_API_KEY`
   - **Value** : ta clé (ex: `RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - **Environments** : coche Production, Preview, Development
4. Clique **Save**
5. Va dans **Deployments** → clique les 3 points sur le dernier deploy → **Redeploy**

✅ La clé est maintenant sécurisée côté serveur, invisible pour les visiteurs.

---

## Étape 5 — (Optionnel) Connecter un domaine personnalisé

1. Achète un domaine sur https://www.ovhcloud.com (ex: `summoner-synergy.fr` ~7€/an)
   ou https://www.namecheap.com (souvent moins cher)
2. Dans Vercel → Settings → **Domains** → entre ton domaine
3. Vercel te donne des enregistrements DNS à copier
4. Sur OVH : Domaines → ton domaine → Zone DNS → Ajouter les enregistrements
5. Attendre 5-30 min (propagation DNS)
6. Vercel génère automatiquement un certificat SSL (HTTPS) 🔒

---

## Tester en local (optionnel)

Si tu veux tester avant de déployer :

1. Installe Node.js : https://nodejs.org
2. Installe Vercel CLI :
   ```bash
   npm install -g vercel
   ```
3. Dans le dossier du projet :
   ```bash
   vercel dev
   ```
4. Vercel te demandera ta clé API au premier lancement
5. Ouvre http://localhost:3000

---

## Mettre à jour le site après modifications

À chaque fois que tu push sur GitHub, Vercel redéploie automatiquement.

```bash
git add .
git commit -m "Description de ta modif"
git push
```

Le site est mis à jour en ~30 secondes.

---

## Limites du plan gratuit Vercel

| Ressource            | Limite gratuite         |
|----------------------|-------------------------|
| Requêtes/mois        | 100 000                 |
| Durée fonction       | 10 secondes max         |
| Bande passante       | 100 GB/mois             |
| Projets              | Illimité                |

Largement suffisant pour un usage personnel ou entre amis.
