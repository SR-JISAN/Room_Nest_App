import { PaymentScalarWhereInput } from "../../../generated/prisma/models";

export interface IQuery extends PaymentScalarWhereInput {
  searchTerm?: string;

  page?: string;
  limit?: string;

  sortBy?: string;
  sortOrder?: "asc" | "desc";

  userEmail?: string;
}
