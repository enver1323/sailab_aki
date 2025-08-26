import React from "react";
import styled from "styled-components";

import Input from "@/components/global/atoms/Input";

const Label = styled.label`
  text-wrap: nowrap;
`


export const DataKeySelector: React.FC<{
  pool: Array<string>;
  selected: Array<string>;
  setSelected: (selected: Array<string>) => void;
  collections: { [name: string]: Array<string> };
}> = ({ pool, selected, setSelected, collections }) => {
  const selectedSet = new Set(selected);

  const onSelectedChange = (key: string) => {
    const updated = [...selected];
    if (updated.includes(key)) {
      updated.splice(updated.indexOf(key), 1);
    } else {
      updated.push(key);
    }
    setSelected(updated);
  };

  const isSelected = (key: string) => selectedSet.has(key);

  const isCollectionChecked = (name: string) =>
    collections[name].every((name: string) => isSelected(name));

  const onCollectionsChange = (name: string) => {
    const collection = collections[name];
    if (isCollectionChecked(name)) {
      const collectionSet = new Set(collection);
      const updated = selected.filter((key: string) => !collectionSet.has(key));
      setSelected(updated);
    } else {
      const updated = new Set([...selected, ...collection]);
      setSelected(Array.from(updated));
    }
  };

  return (
    <>
      {Object.entries(collections).map(([name, keys]) => (
        <p key={name}>
          <Label>
            <Input
              type="checkbox"
              onChange={(e) => onCollectionsChange(name)}
              checked={isCollectionChecked(name)}
            />
            {name}
          </Label>
        </p>
      ))}
      <hr />
      {pool.map((key) => (
        <p key={key}>
          <Label>
            <Input
              type="checkbox"
              onChange={(e) => onSelectedChange(key)}
              checked={isSelected(key)}
            />
            {key}
          </Label>
        </p>
      ))}
    </>
  );
};
