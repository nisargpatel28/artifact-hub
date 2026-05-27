// ─── Core entities ────────────────────────────────────────────────────────────

export interface Artifact {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: 'html' | 'image' | 'pdf';
  storageUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  authorEmail: string;
}

export interface Comment {
  id: string;
  artifactId: string;
  authorEmail: string;
  body: string;
  createdAt: string;
}

export interface ShareLink {
  token: string;
  artifactId: string;
  expiresAt: string;
  createdAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateArtifactDto {
  title: string;
  description: string;
  tags: string[];
  type: Artifact['type'];
  storageUrl: string;
  thumbnailUrl?: string;
  authorEmail: string;
}

export interface CreateCommentDto {
  artifactId: string;
  authorEmail: string;
  body: string;
}

export interface CreateShareLinkDto {
  artifactId: string;
  expiresAt: string;
}
