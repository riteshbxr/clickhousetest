require("dotenv").config();
const { createClient } = require("@clickhouse/client");

if (!process.env.host) {
    console.log("Please add envs for clickhouse");
    process.exit(1);
}

const clickhouseCredentials = {
    host: process.env.host,
    password: process.env.password,
    username: process.env.username,
    database: process.env.database,
    port: 8443,
    protocol: "HTTPS",
    settings: {},
};

const clickHouseClient = createClient({
    url: `${clickhouseCredentials.protocol.toLocaleLowerCase()}://${
        clickhouseCredentials.host
    }:${clickhouseCredentials.port}`,
    username: clickhouseCredentials.username,
    password: clickhouseCredentials.password,
    database: clickhouseCredentials.database,
    clickhouse_settings: clickhouseCredentials.settings,
});

/**
 * @param {string} query
 * @returns {Promise<any>}
 */
async function findOnClickhouse(query) {
    const data = await clickHouseClient.query({ query, format: "JSONEachRow" });
    return data.json();
}

async function createTable(){
    /**
     * Ensure you have access to create
     * Create user testFake IDENTIFIED WITH plaintext_password BY 'qwerty'
     * GRANT SELECT(id,userId), create table, DROP TABLE, INSERT ON contactsV2test TO testFake
     */
    await clickHouseClient.command({
        query: `
      CREATE Table if not exists  contactsV2test
      (
        id                     UUID,
        userId                 UUID
      )
        ENGINE = ReplacingMergeTree ORDER BY (userId, id)
    `,
    });
    await clickHouseClient.command({
        query: `
      INSERT INTO contactsV2test (id, userId)
      VALUES ( '123e4567-e89b-12d3-a456-426614174000', '1f690529-ee3e-45fa-b302-e70b9d508248'),
           ( '223e4567-e89b-12d3-a456-426614174001', '1f690529-ee3e-45fa-b302-e70b9d508248');
    `,
    });
}
async function test() {
    const query = `
        select  id from contactsV2test FINAL 
        where userId='1f690529-ee3e-45fa-b302-e70b9d508248' limit 2`;
    const resultWithoutUnion = await findOnClickhouse(query);
    console.log(resultWithoutUnion);

    const queryUnionDistinctWrapped = `select * from (${query}  UNION DISTINCT ${query})`;
    const resultUnionDistinctWrapped = await findOnClickhouse(
        queryUnionDistinctWrapped
    );
    console.log(resultUnionDistinctWrapped);

    // Fails
    const queryUnionDistinct = `${query}  UNION DISTINCT ${query}`;
    const resultUnionDistinct = await findOnClickhouse(queryUnionDistinct);
    console.log(resultUnionDistinct);
}


createTable()
.then(()=>test())
.then(() => console.log("done"));
