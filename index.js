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

async function test() {
    const query = `
        select  id from contactsV2c FINAL 
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

test().then(() => console.log("done"));
