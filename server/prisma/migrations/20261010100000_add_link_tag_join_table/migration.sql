-- Create the implicit many-to-many relation table for Link.tags.
CREATE TABLE "_LinkToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "_LinkToTag_AB_unique" ON "_LinkToTag"("A", "B");
CREATE INDEX "_LinkToTag_B_index" ON "_LinkToTag"("B");

ALTER TABLE "_LinkToTag"
    ADD CONSTRAINT "_LinkToTag_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_LinkToTag"
    ADD CONSTRAINT "_LinkToTag_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
