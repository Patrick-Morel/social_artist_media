// Import des fonctions et hooks de React Query
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

// Import des clés de requête personnalisées
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";

// Import des fonctions API et types
import {
  createUserAccount,
  signInAccount,
  getCurrentUser,
  signOutAccount,
  getUsers,
  createPost,
  getPostById,
  updatePost,
  getUserPosts,
  deletePost,
  likePost,
  getUserById,
  updateUser,
  getRecentPosts,
  getInfinitePosts,
  searchPosts,
  savePost,
  deleteSavedPost,
} from "@/lib/appwrite/api";
import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/types";

// ============================================================
// REQUÊTES D'AUTHENTIFICATION
// ============================================================

// Créer un compte utilisateur
export const useCreateUserAccount = () => {
  return useMutation({
      mutationFn: (user: INewUser) => createUserAccount(user),
  });
};

// Connecter un utilisateur
export const useSignInAccount = () => {
  return useMutation({
      mutationFn: (user: { email: string; password: string }) =>
          signInAccount(user),
  });
};

// Déconnecter un utilisateur
export const useSignOutAccount = () => {
  return useMutation({
      mutationFn: signOutAccount,
  });
};

// ============================================================
// REQUÊTES DE PUBLICATIONS
// ============================================================

// Obtenir des publications de manière infinie
export const useGetPosts = () => {
  return useInfiniteQuery({
      queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
      queryFn: getInfinitePosts as any,
      getNextPageParam: (lastPage: any) => {
          // S'il n'y a pas de données, il n'y a plus de pages.
          if (lastPage && lastPage.documents.length === 0) {
              return null;
          }

          // Utilisez le $id du dernier document comme curseur.
          const lastId = lastPage.documents[lastPage.documents.length - 1].$id;
          return lastId;
      },
  });
};

// Rechercher des publications
export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
      queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
      queryFn: () => searchPosts(searchTerm),
      enabled: !!searchTerm,
  });
};

// Obtenir des publications récentes
export const useGetRecentPosts = () => {
  return useQuery({
      queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      queryFn: getRecentPosts,
  });
};

// Créer une nouvelle publication
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: (post: INewPost) => createPost(post),
      onSuccess: () => {
          // Invalide les requêtes liées aux publications récentes après la création d'une nouvelle publication.
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
          });
      },
  });
};

// Obtenir une publication par ID
export const useGetPostById = (postId?: string) => {
  return useQuery({
      queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
      queryFn: () => getPostById(postId),
      enabled: !!postId,
  });
};

// Obtenir les publications d'un utilisateur
export const useGetUserPosts = (userId?: string) => {
  return useQuery({
      queryKey: [QUERY_KEYS.GET_USER_POSTS, userId],
      queryFn: () => getUserPosts(userId),
      enabled: !!userId,
  });
};

// Mettre à jour une publication
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: (post: IUpdatePost) => updatePost(post),
      onSuccess: (data) => {
          // Invalide la requête pour obtenir une publication par ID après la mise à jour d'une publication.
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
          });
      },
  });
};

// Supprimer une publication
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: ({ postId, imageId }: { postId?: string; imageId: string }) =>
          deletePost(postId, imageId),
      onSuccess: () => {
          // Invalide les requêtes liées aux publications récentes après la suppression d'une publication.
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
          });
      },
  });
};

// Aimer une publication
export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: ({
          postId,
          likesArray,
      }: {
          postId: string;
          likesArray: string[];
      }) => likePost(postId, likesArray),
      onSuccess: (data) => {
          // Invalide plusieurs requêtes après avoir aimé une publication.
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
          });
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
          });
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_POSTS],
          });
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_CURRENT_USER],
          });
      },
  });
};

// Enregistrer une publication
export const useSavePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: ({ userId, postId }: { userId: string; postId: string }) =>
          savePost(userId, postId),
      onSuccess: () => {
          // Invalide plusieurs requêtes après avoir enregistré une publication.
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
          });
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_POSTS],
          });
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_CURRENT_USER],
          });
      },
  });
};

// Supprimer une publication enregistrée
export const useDeleteSavedPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: (savedRecordId: string) => deleteSavedPost(savedRecordId),
      onSuccess: () => {
          // Invalide plusieurs requêtes après la suppression d'une publication enregistrée.
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
          });
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_POSTS],
          });
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_CURRENT_USER],
          });
      },
  });
};

// ============================================================
// REQUÊTES UTILISATEUR
// ============================================================

// Obtenir l'utilisateur actuel
export const useGetCurrentUser = () => {
  return useQuery({
      queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      queryFn: getCurrentUser,
  });
};

// Obtenir la liste des utilisateurs
export const useGetUsers = (limit?: number) => {
  return useQuery({
      queryKey: [QUERY_KEYS.GET_USERS],
      queryFn: () => getUsers(limit),
  });
};

// Obtenir les détails d'un utilisateur par ID
export const useGetUserById = (userId: string) => {
  return useQuery({
      queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
      queryFn: () => getUserById(userId),
      enabled: !!userId,
  });
};

// Mettre à jour les détails d'un utilisateur
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: (user: IUpdateUser) => updateUser(user),
      onSuccess: (data) => {
          // Invalide plusieurs requêtes après la mise à jour des détails d'un utilisateur.
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_CURRENT_USER],
          });
          queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_USER_BY_ID, data?.$id],
          });
      },
  });
};
