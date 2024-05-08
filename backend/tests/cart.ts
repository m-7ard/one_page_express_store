import context, { getFromContext } from "../backend/context.js";
import { DatabaseUser } from "../backend/database_types.js";
import { User } from "../backend/managers.js";
import { mysqlGetOrNull, mysqlGetQuery } from "../backend/utils.js";
import { testCase } from "./_utils.js";
import { productsMixin, usersMixin } from "./mixins.js";

context.testsToRun = '__all__';

testCase(async () => {
    const pool = getFromContext("pool");

    const id = await User.create({ 
        username: 'test_user',
        password: 'user_word',
        is_admin: 0
    })

    await User.update({ 
        id: id,
        is_admin: 1
    })

})