import { Request, Response, Router } from "express";
import { Book } from "../models/book.model";

const bookRoutes = Router();

bookRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const book = new Book(req.body);
    await book.save();

    res.status(201).send({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    const err = error as Error;
    res.status(400).send({
      success: false,
      message: err.name,
      error: error,
    });
  }
});

bookRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const {
      filter,
      sortBy = "createdAt",
      sort = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    let findQuery = {};
    if (filter) {
      findQuery = { genre: filter };
    }

    let sortQuery: any = {};
    if (sortBy) {
      sortQuery[sortBy as string] = sort === "asc" ? 1 : -1;
    }

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    // get total count
    const total = await Book.countDocuments(findQuery);

    // get paginated data
    const books = await Book.find(findQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(pageLimit);

    res.send({
      success: true,
      message: "Books retrieved successfully",
      data: books,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        total,
        totalPage: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).send({
      success: false,
      message: err.message,
      error,
    });
  }
});

bookRoutes.get("/:bookId", async (req: Request, res: Response) => {
  try {
    const book = await Book.findById(req.params.bookId);

    res.send({
      success: true,
      message: !book ? "Book not found" : "Book retrieved successfully",
      data: book,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).send({
      success: false,
      message: err.message,
      error: error,
    });
  }
});

bookRoutes.patch("/:bookId", async (req: Request, res: Response) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.bookId, req.body, {
      new: true,
    });

    if (!book) {
      res.status(404).send({
        success: false,
        message: "Book not found",
        data: null,
      });
      return;
    }

    res.send({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).send({
      success: false,
      message: err.message,
      error: error,
    });
  }
});

bookRoutes.delete("/:bookId", async (req: Request, res: Response) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.bookId);

    console.log(book);

    if (!book) {
      res.status(404).send({
        success: false,
        message: "Book not found",
        data: null,
      });
      return;
    }

    res.send({
      success: true,
      message: "Book deleted successfully",
      data: null,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).send({
      success: false,
      message: err.message,
      error: error,
    });
  }
});

export { bookRoutes };
