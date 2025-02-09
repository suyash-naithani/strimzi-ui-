import { getTopics } from "@/api/topics/actions";
import { TopicStatus } from "@/api/topics/schema";
import { KafkaParams } from "@/app/[locale]/kafka/[kafkaId]/kafka.params";
import {
  SortableColumns,
  SortableTopicsTableColumns,
  TopicsTable,
} from "@/app/[locale]/kafka/[kafkaId]/topics/(page)/TopicsTable";
import { PageSection } from "@/libs/patternfly/react-core";
import { readonly } from "@/utils/runmode";
import { stringToInt } from "@/utils/stringToInt";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const sortMap: Record<(typeof SortableColumns)[number], string> = {
  name: "name",
  partitions: "partitions",
  storage: "totalLeaderLogBytes",
};

export default function TopicsPage({
  params,
  searchParams,
}: {
  params: KafkaParams;
  searchParams: {
    id: string | undefined;
    name: string | undefined;
    perPage: string | undefined;
    sort: string | undefined;
    sortDir: string | undefined;
    page: string | undefined;
    hidden: string | undefined;
    status: string | undefined;
  };
}) {
  const id = searchParams["id"];
  const name = searchParams["name"];
  const pageSize = stringToInt(searchParams.perPage) || 20;
  const sort = (searchParams["sort"] || "name") as SortableTopicsTableColumns;
  const sortDir = (searchParams["sortDir"] || "asc") as "asc" | "desc";
  const pageCursor = searchParams["page"];
  const includeHidden = searchParams["hidden"] === "y";
  const status = (searchParams["status"] || "")
    .split(",")
    .filter((v) => !!v) as TopicStatus[] | undefined;

  return (
    <PageSection isFilled>
      <Suspense
        fallback={
          <TopicsTable
            topics={undefined}
            topicsCount={0}
            id={id}
            name={name}
            perPage={pageSize}
            sort={sort}
            sortDir={sortDir}
            includeHidden={includeHidden}
            status={status}
            canCreate={!readonly()}
            baseurl={`/kafka/${params.kafkaId}/topics`}
            page={1}
            nextPageCursor={undefined}
            prevPageCursor={undefined}
          />
        }
      >
        <ConnectedTopicsTable
          id={id}
          name={name}
          sort={sort}
          sortDir={sortDir}
          pageSize={pageSize}
          pageCursor={pageCursor}
          kafkaId={params.kafkaId}
          includeHidden={includeHidden}
          status={status}
        />
      </Suspense>
    </PageSection>
  );
}

async function ConnectedTopicsTable({
  kafkaId,
  id,
  name,
  sortDir,
  sort,
  pageCursor,
  pageSize,
  includeHidden,
  status,
}: {
  sort: SortableTopicsTableColumns;
  id: string | undefined;
  name: string | undefined;
  sortDir: "asc" | "desc";
  pageSize: number;
  pageCursor: string | undefined;
  includeHidden: boolean;
  status: TopicStatus[] | undefined;
} & KafkaParams) {
  const topics = await getTopics(kafkaId, {
    id,
    name,
    sort: sortMap[sort],
    sortDir,
    pageSize,
    pageCursor,
    includeHidden,
    status,
  });

  const nextPageQuery = topics.links.next
    ? new URLSearchParams(topics.links.next)
    : undefined;
  const nextPageCursor = nextPageQuery?.get("page[after]");
  const prevPageQuery = topics.links.prev
    ? new URLSearchParams(topics.links.prev)
    : undefined;
  const prevPageCursor = prevPageQuery?.get("page[after]");
  return (
    <TopicsTable
      topics={topics.data}
      topicsCount={topics.meta.page.total}
      id={id}
      name={name}
      perPage={pageSize}
      sort={sort}
      sortDir={sortDir}
      includeHidden={includeHidden}
      status={status}
      canCreate={!readonly()}
      baseurl={`/kafka/${kafkaId}/topics`}
      page={topics.meta.page.pageNumber || 1}
      nextPageCursor={nextPageCursor}
      prevPageCursor={prevPageCursor}
    />
  );
}
