export abstract class DomainError extends Error {
  abstract readonly category: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
