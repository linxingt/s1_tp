import {readFile, writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {getDate, monSecret} from "./divers.js";
import {v4} from "uuid";


/* Chemin de stockage des blocks */
const path = '../data/blockchain.json'
const filePath = new URL(path, import.meta.url)

/**
 * Mes définitions
 * @typedef { id: string, nom: string, don: number, date: string,hash: string} Block
 * @property {string} id
 * @property {string} nom
 * @property {number} don
 * @property {string} date
 * @property {string} string
 *
 */

/**
 * Renvoie un tableau json de tous les blocks
 * @return {Promise<any>}
 */
export async function findBlocks() {
    // A coder
    let existingBlocks;
    try {
        const content = await readFile(filePath, 'utf-8');
        existingBlocks = JSON.parse(content);

        // Ensure existingBlocks is an array
        if (!Array.isArray(existingBlocks)) {
            existingBlocks = [];
        }
    } catch (readError) {
        // If the file doesn't exist or is not valid JSON, initialize with an empty array
        console.error('Erreur lors de la lecture du fichier blockchain.json', readError);
        existingBlocks = [];
    }
    return existingBlocks;
}

/**
 * Trouve un block à partir de son id
 * @param partialBlock
 * @return {Promise<Block[]>}
 */
export async function findBlock(partialBlock) {
    // A coder
    try {
        const existingBlocks = await findBlocks();

        if (existingBlocks.length === 0) {
            // Empty blockchain
            return [];
        }

        // Search for the block with the specified ID
        const targetBlock = existingBlocks.find((block) => block.id === partialBlock.id);

        if (!targetBlock) {
            return {
                "status": "error",
                "message": "Block not found."
            };
        }

        // Vérifie la fiabilité du bloc
        const isReliable=verifBlocks();

        if (isReliable) {
            return targetBlock;
        } else {
            return {
                "status": "error",
                "message": "Block is not reliable."
            };
        }

    } catch (error) {
        console.error('Erreur lors de la recherche du bloc par ID', error);
        throw error;
    }
}

/**
 * Trouve le dernier block de la chaine
 * @return {Promise<Block|null>}
 */
export async function findLastBlock() {
    // A coder
    try {
        const existingBlocks = await findBlocks();

        if (existingBlocks.length > 0) {
            return existingBlocks[existingBlocks.length - 1];
        } else {
            return null;
        }
    } catch (error) {
        // Handle errors
        console.error('Erreur lors de la recherche du dernier block', error);
        throw error;
    }
}

/**
 * Calcule le hash sha256
 * @param {string} data
 * @return {string}
 */
function calculateHash(data) {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
}

/**
 * Creation d'un block depuis le contenu json
 * @param contenu
 * @return {Promise<Block[]>}
 */
export async function createBlock(contenu) {
    // A coder
    try {
        // Générer un nouvel ID avec uuidv4
        const newBlockId = v4();

        // Obtenir la date au format demandé
        const currentDate = getDate();

        // Trouver le dernier bloc dans la chaîne
        const lastBlock = await findLastBlock();

        // Récupérer le hash du bloc précédent
        const previousHash = lastBlock ? lastBlock.hash : null;

        // Créer le nouveau block avec les informations fournies
        const newBlock = {
            id: newBlockId,
            nom: contenu.nom,
            don: contenu.don,
            date: currentDate,
            hash: lastBlock ? calculateHash({id: newBlockId, nom: contenu.nom, don: contenu.don, date: currentDate, previousHash: previousHash}): calculateHash(monSecret),
            previousHash,
        };
        const existingBlocks = await findBlocks();

        existingBlocks.push(newBlock);

        // Enregistrer le tableau mis à jour dans le fichier blockchain.json
        await writeFile(filePath, JSON.stringify(existingBlocks, null, 2), 'utf-8');

        // Retourner le tableau complet après ajout du nouveau block
        return existingBlocks;
    } catch (error) {
        // Gestion des erreurs
        console.error('Erreur lors de la création du block', error);
        throw error;
    }
}

/**
 * Vérifie l'intégrité de la chaîne
 * @return {Promise<boolean>}
 */
export async function verifBlocks() {
    try {
        const existingBlocks = await findBlocks();

        if (existingBlocks.length === 0) {
            // Empty blockchain
            console.log("false",existingBlocks.length);
            return false;
        }

        // Check integrity of the blockchain
        for (let i = 1; i < existingBlocks.length; i++) {
            const currentBlock = existingBlocks[i];
            const previousBlock = existingBlocks[i - 1];

            // Check if the hash of the previous block matches the 'previousHash' field of the current block
            if(i === 1){
                if (calculateHash(monSecret) !== currentBlock.previousHash) {
                    console.log("false",i);
                    return false; // Integrity compromised
                }
            }else{
                if (calculateHash({id: previousBlock.id, nom: previousBlock.nom, don: previousBlock.don, date: previousBlock.date, previousHash: previousBlock.previousHash}) !== currentBlock.previousHash) {
                    console.log(currentBlock);
                    console.log(previousBlock);
                    console.log(currentBlock.previousHash);
                    console.log(calculateHash({id: previousBlock.id, nom: previousBlock.nom, don: previousBlock.don, date: previousBlock.date, previousHash: previousBlock.previousHash}));
                    console.log("false",i);
                    return false; // Integrity compromised
                }
            }
        }
        console.log("true");
        return true; // Blockchain is intact
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'intégrité de la chaîne', error);
        throw error;
    }


}

