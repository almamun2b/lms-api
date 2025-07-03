import { Request, Response, Router } from "express";
import { Book } from "../models/book.model";
import { Borrow } from "../models/borrow.model";

const borrowRoutes = Router();

borrowRoutes.post("/", async (req: Request, res: Response) => {
  try {
    const { book: bookId, quantity, dueDate } = req.body;

    const book = await Book.borrowBook(bookId, quantity);
    console.log(book);

    const borrow = new Borrow({ book: bookId, quantity, dueDate });
    await borrow.save();

    res.status(201).send({
      success: true,
      message: "Book borrowed successfully",
      data: borrow,
    });
  } catch (error) {
    const err = error as Error;
    res.status(400).send({
      success: false,
      message: err.message,
      error,
    });
  }
});
borrowRoutes.get("/", async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "10" } = req.query;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    // first, get total
    const totalResult = await Borrow.aggregate([
      {
        $group: {
          _id: "$book",
        },
      },
      {
        $count: "total",
      },
    ]);

    const total = totalResult[0]?.total || 0;

    // then, get paginated data
    const summary = await Borrow.aggregate([
      {
        $group: {
          _id: "$book",
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "bookInfo",
        },
      },
      {
        $unwind: "$bookInfo",
      },
      {
        $project: {
          _id: 0,
          book: {
            title: "$bookInfo.title",
            isbn: "$bookInfo.isbn",
          },
          totalQuantity: 1,
        },
      },
      { $skip: skip },
      { $limit: pageLimit },
    ]);

    res.status(200).send({
      success: true,
      message: "Borrowed books summary retrieved successfully",
      data: summary,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        total,
        totalPage: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error,
    });
  }
});

export { borrowRoutes };
