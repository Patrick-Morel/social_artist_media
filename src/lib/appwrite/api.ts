import { ID, Query } from "appwrite";

import { appwriteConfig, account, databases, storage, avatars } from "./config";
import { IUpdatePost, INewPost, INewUser, IUpdateUser } from "@/types";

// ============================================================
// AUTHENTIFICATION
// ============================================================

// ============================== INSCRIPTION
export async function createUserAccount(user: INewUser) {
  try {
    // Création d'un nouveau compte utilisateur
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw Error;

    // Génération de l'URL de l'avatar
    const avatarUrl = avatars.getInitials(user.name);

    // Sauvegarde de l'utilisateur dans la base de données
    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: avatarUrl,
    });

    return newUser;
  } catch (error) {
    console.log(error);
    return error;
  }
}

// ============================== SAUVEGARDE DE L'UTILISATEUR DANS LA BDD
export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  username?: string;
}) {
  try {
    // Création d'un document utilisateur dans la base de données
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );

    return newUser;
  } catch (error) {
    console.log(error);
  }
}

// ============================== CONNEXION
export async function signInAccount(user: { email: string; password: string }) {
  try {
    // Création d'une session de connexion par e-mail
    const session = await account.createEmailSession(user.email, user.password);

    return session;
  } catch (error) {
    console.log(error);
  }
}

// ============================== OBTENIR LE COMPTE
export async function getAccount() {
  try {
    // Obtention du compte utilisateur actuel
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    console.log(error);
  }
}

// ============================== OBTENIR L'UTILISATEUR ACTUEL
export async function getCurrentUser() {
  try {
    // Obtention du compte utilisateur actuel
    const currentAccount = await getAccount();

    if (!currentAccount) throw Error;

    // Recherche de l'utilisateur dans la base de données en utilisant l'ID du compte
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ============================== DÉCONNEXION
export async function signOutAccount() {
  try {
    // Suppression de la session de connexion actuelle
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// PUBLICATIONS
// ============================================================

// ============================== CRÉATION DE LA PUBLICATION
export async function createPost(post: INewPost) {
  try {
    // Téléchargement du fichier dans le stockage Appwrite
    const uploadedFile = await uploadFile(post.file[0]);

    if (!uploadedFile) throw Error;

    // Obtention de l'URL du fichier
    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    // Conversion des tags en tableau
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    // Création de la publication
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
      }
    );

    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    return newPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== TÉLÉCHARGEMENT DU FICHIER
export async function uploadFile(file: File) {
  try {
    // Création d'un fichier dans le stockage Appwrite
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    );

    return uploadedFile;
  } catch (error) {
    console.log(error);
  }
}

// ============================== OBTENIR L'URL DU FICHIER
export function getFilePreview(fileId: string) {
  try {
    // Obtention de l'URL de prévisualisation du fichier depuis le stockage Appwrite
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      "top",
      100
    );

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}


// ============================== SUPPRIMER LE FICHIER
export async function deleteFile(fileId: string) {
  try {
    // Suppression du fichier depuis le stockage Appwrite
    await storage.deleteFile(appwriteConfig.storageId, fileId);

    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== OBTENIR LES PUBLICATIONS
export async function searchPosts(searchTerm: string) {
  try {
    // Recherche de publications dans la base de données Appwrite en fonction du terme de recherche
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search("caption", searchTerm)]
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  const queries: any[] = [Query.orderDesc("$updatedAt"), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    // Obtention d'un nombre spécifié de publications avec pagination
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

// ============================== OBTENIR UNE PUBLICATION PAR SON ID
export async function getPostById(postId?: string) {
  if (!postId) throw Error;

  try {
    // Obtention d'une publication à partir de son ID
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

// ============================== METTRE À JOUR UNE PUBLICATION
export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      // Téléchargement d'un nouveau fichier dans le stockage Appwrite
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Obtention de la nouvelle URL du fichier
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    // Conversion des tags en tableau
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    //  Mise à jour de la publication
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    // Échec de la mise à jour
    if (!updatedPost) {
      // Suppression du nouveau fichier qui a été téléchargé récemment
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }

      // Si aucun nouveau fichier n'a été téléchargé, lancez simplement une erreur
      throw Error;
    }

    // Suppression sécurisée de l'ancien fichier après une mise à jour réussie
    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}


// ============================== SUPPRIMER LA PUBLICATION
export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) return;

  try {
    // Suppression de la publication depuis la base de données Appwrite
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!statusCode) throw Error;

    // Suppression du fichier associé à la publication
    await deleteFile(imageId);

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== LIKER / DISLIKER UNE PUBLICATION
export async function likePost(postId: string, likesArray: string[]) {
  try {
    // Mise à jour des "likes" d'une publication dans la base de données Appwrite
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray,
      }
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== ENREGISTRER UNE PUBLICATION
export async function savePost(userId: string, postId: string) {
  try {
    // Enregistrement d'une publication dans la collection "saves" de la base de données Appwrite
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {
        user: userId,
        post: postId,
      }
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== SUPPRIMER UNE PUBLICATION ENREGISTRÉE
export async function deleteSavedPost(savedRecordId: string) {
  try {
    // Suppression d'une publication enregistrée depuis la collection "saves" de la base de données Appwrite
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId
    );

    if (!statusCode) throw Error;

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== OBTENIR LES PUBLICATIONS DE L'UTILISATEUR
export async function getUserPosts(userId?: string) {
  if (!userId) return;

  try {
    // Obtention des publications de l'utilisateur depuis la base de données Appwrite
    const post = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

// ============================== OBTENIR LES PUBLICATIONS POPULAIRES (PAR LE NOMBRE DE J'AIME LE PLUS ÉLEVÉ)
export async function getRecentPosts() {
  try {
    // Obtention des dernières publications par ordre de création depuis la base de données Appwrite
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(20)]
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}


// ============================================================
// UTILISATEUR
// ============================================================

// ============================== OBTENIR LES UTILISATEURS
export async function getUsers(limit?: number) {
  const queries: any[] = [Query.orderDesc("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  try {
    // Obtention des utilisateurs depuis la base de données Appwrite
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries
    );

    if (!users) throw Error;

    return users;
  } catch (error) {
    console.log(error);
  }
}

// ============================== OBTENIR L'UTILISATEUR PAR SON ID
export async function getUserById(userId: string) {
  try {
    // Obtention d'un utilisateur depuis la base de données Appwrite par son id
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    );

    if (!user) throw Error;

    return user;
  } catch (error) {
    console.log(error);
  }
}

// ============================== METTRE À JOUR L'UTILISATEUR
export async function updateUser(user: IUpdateUser) {
  const hasFileToUpdate = user.file.length > 0;
  try {
    let image = {
      imageUrl: user.imageUrl,
      imageId: user.imageId,
    };

    if (hasFileToUpdate) {
      // Téléchargement du nouveau fichier vers le stockage Appwrite
      const uploadedFile = await uploadFile(user.file[0]);
      if (!uploadedFile) throw Error;

      // Obtention de la nouvelle URL du fichier
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    //  Mettre à jour l'utilisateur
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      user.userId,
      {
        name: user.name,
        username: user.username,
        bio: user.bio,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
      }
    );

    // Échec de la mise à jour
    if (!updatedUser) {
      // Supprimer le nouveau fichier récemment téléchargé
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      // S'il n'y a pas de nouveau fichier téléchargé, générer une erreur
      throw Error;
    }

    // Supprimer en toute sécurité l'ancien fichier après une mise à jour réussie
    if (user.imageId && hasFileToUpdate) {
      await deleteFile(user.imageId);
    }

    return updatedUser;
  } catch (error) {
    console.log(error);
  }
}
