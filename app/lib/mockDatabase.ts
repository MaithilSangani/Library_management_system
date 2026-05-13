// Shared mock database for demo purposes
// In production, this would be replaced with actual database operations

export interface MockItem {
  itemId: number;
  title: string;
  author: string;
  isbn?: string;
  subject?: string;
  itemType: string;
  availableCopies: number;
  totalCopies: number;
  imageUrl?: string;
  price: number;
  condition: string;
  keywords?: string;
  description?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}


export const mockItemDatabase: MockItem[] = [
  {
    itemId: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    subject: "Literature",
    itemType: "Book",
    availableCopies: 3,
    totalCopies: 5,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    price: 15.99,
    condition: "EXCELLENT",
    keywords: "american literature classic gatsby",
    description: "A classic American novel set in the Jazz Age",
    rating: 4,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    itemId: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    subject: "Literature",
    itemType: "Book",
    availableCopies: 0,
    totalCopies: 3,
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    price: 12.99,
    condition: "GOOD",
    keywords: "american literature classic mockingbird",
    description: "A gripping tale of racial injustice and loss of innocence",
    rating: 5,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z"
  },
  {
    itemId: 3,
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    subject: "Dystopian Fiction",
    itemType: "Book",
    availableCopies: 2,
    totalCopies: 4,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
    price: 13.99,
    condition: "EXCELLENT",
    keywords: "dystopian orwell science fiction",
    description: "A dystopian social science fiction novel",
    rating: 4,
    createdAt: "2024-01-03T00:00:00.000Z",
    updatedAt: "2024-01-03T00:00:00.000Z"
  },
  {
    itemId: 4,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780486284736",
    subject: "Romance",
    itemType: "Book",
    availableCopies: 1,
    totalCopies: 2,
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop",
    price: 11.99,
    condition: "GOOD",
    keywords: "romance austen english literature",
    description: "A romantic novel about manners and marriage",
    rating: 4,
    createdAt: "2024-01-04T00:00:00.000Z",
    updatedAt: "2024-01-04T00:00:00.000Z"
  },
  {
    itemId: 5,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    isbn: "9780316769488",
    subject: "Coming of Age",
    itemType: "Book",
    availableCopies: 4,
    totalCopies: 6,
    imageUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop",
    price: 14.99,
    condition: "EXCELLENT",
    keywords: "american literature salinger young adult",
    description: "A controversial novel about teenage rebellion",
    rating: 3,
    createdAt: "2024-01-05T00:00:00.000Z",
    updatedAt: "2024-01-05T00:00:00.000Z"
  },
  {
    itemId: 6,
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    isbn: "9780439708180",
    subject: "Fantasy",
    itemType: "Book",
    availableCopies: 5,
    totalCopies: 8,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
    price: 16.99,
    condition: "EXCELLENT",
    keywords: "fantasy magic wizard rowling",
    description: "The first book in the Harry Potter series",
    rating: 5,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  },
  {
    itemId: 7,
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    subject: "Fantasy",
    itemType: "Book",
    availableCopies: 2,
    totalCopies: 3,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    price: 24.99,
    condition: "EXCELLENT",
    keywords: "fantasy tolkien middle earth rings",
    description: "An epic high fantasy adventure",
    rating: 5,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z"
  },
  {
    itemId: 8,
    title: "Dune",
    author: "Frank Herbert",
    isbn: "9780441172719",
    subject: "Science Fiction",
    itemType: "Book",
    availableCopies: 3,
    totalCopies: 4,
    imageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=600&fit=crop",
    price: 18.99,
    condition: "GOOD",
    keywords: "science fiction desert planet spice",
    description: "A science fiction masterpiece about desert planets",
    rating: 4,
    createdAt: "2024-01-03T00:00:00.000Z",
    updatedAt: "2024-01-03T00:00:00.000Z"
  },
  {
    itemId: 9,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928241",
    subject: "Fantasy",
    itemType: "Book",
    availableCopies: 6,
    totalCopies: 7,
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    price: 14.99,
    condition: "EXCELLENT",
    keywords: "fantasy hobbit adventure tolkien",
    description: "A charming adventure story that precedes The Lord of the Rings",
    rating: 5,
    createdAt: "2024-01-04T00:00:00.000Z",
    updatedAt: "2024-01-04T00:00:00.000Z"
  },
  {
    itemId: 10,
    title: "The Da Vinci Code",
    author: "Dan Brown",
    isbn: "9780307474278",
    subject: "Mystery",
    itemType: "Book",
    availableCopies: 1,
    totalCopies: 3,
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    price: 16.99,
    condition: "GOOD",
    keywords: "mystery thriller da vinci symbology",
    description: "A thrilling mystery involving art, history, and secret societies",
    rating: 4,
    createdAt: "2024-01-05T00:00:00.000Z",
    updatedAt: "2024-01-05T00:00:00.000Z"
  },
  {
    itemId: 11,
    title: "The Alchemist",
    author: "Paulo Coelho",
    isbn: "9780061122415",
    subject: "Philosophy",
    itemType: "Book",
    availableCopies: 4,
    totalCopies: 5,
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop",
    price: 13.99,
    condition: "EXCELLENT",
    keywords: "philosophy spiritual journey dreams",
    description: "A philosophical novel about following your dreams",
    rating: 4,
    createdAt: "2024-01-06T00:00:00.000Z",
    updatedAt: "2024-01-06T00:00:00.000Z"
  },
  {
    itemId: 12,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    subject: "History",
    itemType: "Book",
    availableCopies: 2,
    totalCopies: 4,
    imageUrl: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=600&fit=crop",
    price: 19.99,
    condition: "EXCELLENT",
    keywords: "history anthropology human evolution",
    description: "A brief history of humankind",
    rating: 5,
    createdAt: "2024-01-07T00:00:00.000Z",
    updatedAt: "2024-01-07T00:00:00.000Z"
  },
  {
    itemId: 13,
    title: "The Silent Patient",
    author: "Alex Michaelides",
    isbn: "9781250301697",
    subject: "Thriller",
    itemType: "Book",
    availableCopies: 0,
    totalCopies: 2,
    imageUrl: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&h=600&fit=crop",
    price: 17.99,
    condition: "GOOD",
    keywords: "thriller psychological mystery silent",
    description: "A psychological thriller about a silent patient",
    rating: 4,
    createdAt: "2024-01-08T00:00:00.000Z",
    updatedAt: "2024-01-08T00:00:00.000Z"
  },
  {
    itemId: 14,
    title: "Educated",
    author: "Tara Westover",
    isbn: "9780399590504",
    subject: "Biography",
    itemType: "Book",
    availableCopies: 3,
    totalCopies: 4,
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop",
    price: 16.99,
    condition: "EXCELLENT",
    keywords: "memoir education family survival",
    description: "A memoir about education and family",
    rating: 5,
    createdAt: "2024-01-09T00:00:00.000Z",
    updatedAt: "2024-01-09T00:00:00.000Z"
  },
  {
    itemId: 15,
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    isbn: "9781501161933",
    subject: "Fiction",
    itemType: "Book",
    availableCopies: 5,
    totalCopies: 6,
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
    price: 15.99,
    condition: "EXCELLENT",
    keywords: "fiction hollywood glamour secrets",
    description: "A captivating novel about a reclusive Hollywood icon",
    rating: 5,
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z"
  }
];


// Helper function to get user from token (shared across APIs)
export function getUserFromRequest(request: Request): { patronId: number; email: string } | null {
  // In production, this would verify JWT tokens
  // For demo purposes, return a mock user
  return { patronId: 1, email: 'demo@example.com' };
}
