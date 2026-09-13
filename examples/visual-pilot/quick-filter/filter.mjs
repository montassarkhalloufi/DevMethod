export function filterBooks(books, status) {
  return books.filter(book => status === 'all' || book.status === status);
}
