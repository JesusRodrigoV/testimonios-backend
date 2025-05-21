interface Comment {
  id_forocoment: number;
  contenido: string;
  fecha_creacion: Date;
  creado_por_id_usuario: number;
  id_forotema: number;
  parent_id: number | null;
  usuarios: {
    id_usuario: number;
    nombre: string;
    email: string;
    profile_image: string | null;
  };
}

interface CommentWithChildren extends Comment {
  children: CommentWithChildren[];
}

export function buildCommentTree(comments: Comment[]): CommentWithChildren[] {
  const commentMap = new Map<number, CommentWithChildren>();
  
  comments.forEach(comment => {
    commentMap.set(comment.id_forocoment, { ...comment, children: [] });
  });
  
  const rootComments: CommentWithChildren[] = [];
  
  comments.forEach(comment => {
    const commentWithChildren = commentMap.get(comment.id_forocoment)!;
    
    if (comment.parent_id === null) {
      rootComments.push(commentWithChildren);
    } else {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.children.push(commentWithChildren);
      }
    }
  });
  
  return rootComments;
}

export function sortCommentsByDate(comments: CommentWithChildren[]): CommentWithChildren[] {
  return comments.sort((a, b) => {
    const dateComparison = new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
    if (dateComparison !== 0) return dateComparison;
    
    return b.id_forocoment - a.id_forocoment;
  }).map(comment => ({
    ...comment,
    children: sortCommentsByDate(comment.children)
  }));
} 