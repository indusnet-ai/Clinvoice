import { useEffect, useState } from "react";
import queryString from "query-string";
import { parseQueryStrings } from "@utils";
import { useLocation, useNavigate } from "react-router-dom";
export const useSearchParams = () => {
  const { search, pathname, hash } = useLocation();
  const history = useNavigate();
  const [query, setQueryStrings] = useState({});
  useEffect(() => {
    setQueryStrings(parseQueryStrings(search));
  }, [search]);
  const updateSearchParams = (query: any) => {
    for (let key in query) {
      if (query[key] === "") {
        delete query[key];
      }
    }
    history({
      pathname: pathname,
      search: queryString.stringify(query),
      hash: hash,
    });
  };
  return {
    query,
    updateSearchParams,
    hash,
  };
};
