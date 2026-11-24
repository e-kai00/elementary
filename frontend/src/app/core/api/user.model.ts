export interface ElementaryUser {
  readonly id: string;
  readonly username: string | null;
  readonly name: string | null;
  readonly email: string | null;
  readonly created_at: string;
}
