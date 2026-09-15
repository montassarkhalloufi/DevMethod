# Current contract

The remaining capacity cannot become negative. Each successful reservation consumes exactly one place. Two competing requests for the last place must yield one success and one conflict, including when served by two API instances using PostgreSQL. Web availability must reflect successful reservations. The current API returns { id, remaining }. Only fictional data and local execution are authorized.
