import { env } from "process";
import context, { getFromContext } from "../backend/context.js";
import { DatabaseUser } from "../backend/database_types.js";
import { User } from "../backend/managers.js";
import { mysqlGetOrNull, mysqlGetQuery } from "../backend/utils.js";
import { objectToFormData, test, testCase } from "./_utils.js";
import { productsMixin, usersMixin } from "./mixins.js";

context.testsToRun = '__all__';

testCase(async () => {
    const pool = getFromContext("pool");

    const users = await usersMixin();
    const products = await productsMixin({ users });
    console.log(products)

})