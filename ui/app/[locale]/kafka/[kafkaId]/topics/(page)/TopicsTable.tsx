"use client";
import { TopicList, TopicStatus } from "@/api/topics/schema";
import { EmptyStateNoTopics } from "@/app/[locale]/kafka/[kafkaId]/topics/(page)/EmptyStateNoTopics";
import { ButtonLink } from "@/components/ButtonLink";
import { Bytes } from "@/components/Bytes";
import { ManagedTopicLabel } from "@/components/ManagedTopicLabel";
import { Number } from "@/components/Number";
import { TableView } from "@/components/Table";
import { EmptyStateNoMatchFound } from "@/components/Table/EmptyStateNoMatchFound";
import { Switch } from "@/libs/patternfly/react-core";
import { TableVariant } from "@/libs/patternfly/react-table";
import { Link, useRouter } from "@/navigation";
import { readonly } from "@/utils/runmode";
import { useFilterParams } from "@/utils/useFilterParams";
import { Icon, Tooltip } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  HelpIcon,
} from "@patternfly/react-icons";
import { useTranslations } from "next-intl";
import { ReactNode, useOptimistic, useTransition } from "react";

export const TopicsTableColumns = [
  "name",
  "status",
  "partitions",
  "consumerGroups",
  "storage",
] as const;
export type SortableTopicsTableColumns = Exclude<
  TopicsTableColumn,
  "consumerGroups" | "partitions"
>;
export type TopicsTableColumn = (typeof TopicsTableColumns)[number];
export const SortableColumns = ["name", "storage"];
const StatusLabel: Record<TopicStatus, ReactNode> = {
  FullyReplicated: (
    <>
      <Icon status={"success"}>
        <CheckCircleIcon />
      </Icon>
      &nbsp;Fully replicated
    </>
  ),
  UnderReplicated: (
    <>
      <Icon status={"warning"}>
        <ExclamationTriangleIcon />
      </Icon>
      &nbsp;Under replicated
    </>
  ),
  PartiallyOffline: (
    <>
      <Icon status={"warning"}>
        <ExclamationTriangleIcon />
      </Icon>
      &nbsp;Partially offline
    </>
  ),
  Offline: (
    <>
      <Icon status={"danger"}>
        <ExclamationCircleIcon />
      </Icon>
      &nbsp;Offline
    </>
  ),
};

export type TopicsTableProps = {
  topics: TopicList[] | undefined;
  topicsCount: number;
  canCreate: boolean;
  page: number;
  perPage: number;
  id: string | undefined;
  name: string | undefined;
  sort: TopicsTableColumn;
  sortDir: "asc" | "desc";
  includeHidden: boolean;
  status: TopicStatus[] | undefined;
  baseurl: string;
  nextPageCursor: string | null | undefined;
  prevPageCursor: string | null | undefined;
};

type State = {
  id: string | undefined;
  name: string | undefined;
  topics: TopicList[] | undefined;
  perPage: number;
  sort: TopicsTableColumn;
  sortDir: "asc" | "desc";
  includeHidden: boolean;
  status: TopicStatus[] | undefined;
};

export function TopicsTable({
  canCreate,
  topics,
  topicsCount,
  page,
  perPage,
  id,
  name,
  sort,
  sortDir,
  includeHidden,
  status,
  baseurl,
  nextPageCursor,
  prevPageCursor,
}: TopicsTableProps) {
  const t = useTranslations("topics");
  const router = useRouter();
  const _updateUrl = useFilterParams({ perPage, sort, sortDir, includeHidden });
  const [_, startTransition] = useTransition();
  const [state, addOptimistic] = useOptimistic<
    State,
    Partial<Omit<State, "topics">>
  >(
    {
      topics,
      id,
      name,
      perPage,
      sort,
      sortDir,
      includeHidden,
      status,
    },
    (state, options) => ({ ...state, ...options, topics: undefined }),
  );

  const updateUrl: typeof _updateUrl = (newParams) => {
    const { topics, ...s } = state;
    _updateUrl({
      ...s,
      ...newParams,
    });
  };

  function clearFilters() {
    startTransition(() => {
      _updateUrl({});
      addOptimistic({
        name: undefined,
        id: undefined,
        status: undefined,
      });
    });
  }

  return (
    <TableView
      itemCount={topicsCount}
      page={page}
      perPage={state.perPage}
      onPageChange={(newPage, perPage) => {
        startTransition(() => {
          const pageDiff = newPage - page;
          switch (pageDiff) {
            case -1:
              updateUrl({ perPage, page: prevPageCursor });
              break;
            case 1:
              updateUrl({ perPage, page: nextPageCursor });
              break;
            default:
              updateUrl({ perPage });
              break;
          }
          addOptimistic({ perPage });
        });
      }}
      data={state.topics}
      emptyStateNoData={<EmptyStateNoTopics createHref={`${baseurl}/create`} />}
      emptyStateNoResults={<EmptyStateNoMatchFound onClear={clearFilters} />}
      isFiltered={
        name !== undefined || id !== undefined || status !== undefined
      }
      ariaLabel={"Topics"}
      columns={TopicsTableColumns}
      isColumnSortable={(col) => {
        if (!SortableColumns.includes(col)) {
          return undefined;
        }
        const activeIndex = TopicsTableColumns.indexOf(state.sort);
        const columnIndex = TopicsTableColumns.indexOf(col);
        return {
          label: col as string,
          columnIndex,
          onSort: () => {
            startTransition(() => {
              const newSortDir =
                activeIndex === columnIndex
                  ? state.sortDir === "asc"
                    ? "desc"
                    : "asc"
                  : "asc";
              updateUrl({
                sort: col,
                sortDir: newSortDir,
              });
              addOptimistic({ sort: col, sortDir: newSortDir });
            });
          },
          sortBy: {
            index: activeIndex,
            direction: state.sortDir,
            defaultDirection: "asc",
          },
          isFavorites: undefined,
        };
      }}
      // onRowClick={({ row }) => {
      //   startTransition(() => {
      //     router.push(`./topics/${row.id}`);
      //   });
      // }}
      renderHeader={({ Th, column, key }) => {
        switch (column) {
          case "name":
            return (
              <Th key={key} width={30} dataLabel={"Topic"}>
                Name
              </Th>
            );
          case "status":
            return (
              <Th key={key} dataLabel={"Status"}>
                Status{" "}
                <Tooltip
                  style={{ whiteSpace: "pre-line" }}
                  content={`Indicates the replication status of the partitions in the Kafka topic.
                   A partition is fully replicated when its replicas (followers) are 'in-sync' with the designated partition leader.
                   A partition is under-replicated if partition replicas (followers) are not 'in-sync with their designated partition leader.
                   If the status shows unavailable, some or all partitions are currently unavailable due to underlying issues.`}
                >
                  <HelpIcon />
                </Tooltip>
              </Th>
            );
          case "consumerGroups":
            return (
              <Th key={key} dataLabel={"Consumer groups"}>
                Consumer groups
              </Th>
            );
          case "partitions":
            return (
              <Th key={key} dataLabel={"Partitions"}>
                Partitions
              </Th>
            );
          case "storage":
            return (
              <Th key={key} dataLabel={"Storage"}>
                Storage
              </Th>
            );
        }
      }}
      renderCell={({ Td, column, row, key }) => {
        switch (column) {
          case "name":
            return (
              <Td key={key} dataLabel={"Topic"}>
                <Link href={`${baseurl}/${row.id}/messages`}>
                  {row.attributes.name}
                </Link>
                {row.meta?.managed === true && <ManagedTopicLabel />}
              </Td>
            );
          case "status":
            return (
              <Td key={key} dataLabel={"Status"}>
                {StatusLabel[row.attributes.status]}
              </Td>
            );
          case "consumerGroups":
            return (
              <Td key={key} dataLabel={"Consumer groups"}>
                <ButtonLink
                  variant={"link"}
                  href={`${baseurl}/${row.id}/consumer-groups`}
                >
                  <Number
                    value={row.relationships.consumerGroups.data.length}
                  />
                </ButtonLink>
              </Td>
            );
          case "partitions":
            return (
              <Td key={key} dataLabel={"Partitions"}>
                <ButtonLink
                  variant={"link"}
                  href={`${baseurl}/${row.id}/partitions`}
                >
                  <Number value={row.attributes.numPartitions} />
                </ButtonLink>
              </Td>
            );
          case "storage":
            return (
              <Td key={key} dataLabel={"Storage"}>
                <Bytes value={row.attributes.totalLeaderLogBytes} />
              </Td>
            );
        }
      }}
      renderActions={({ row, ActionsColumn }) =>
        readonly() ? (
          <></>
        ) : (
          <ActionsColumn
            items={[
              {
                title: "Edit configuration",
                onClick: () => {
                  startTransition(() => {
                    router.push(`${baseurl}/${row.id}/configuration`);
                  });
                },
              },
              {
                isSeparator: true,
              },
              {
                title: "Delete topic",
                onClick: () => {
                  startTransition(() => {
                    router.push(`${baseurl}/${row.id}/delete`);
                  });
                },
              },
            ]}
          />
        )
      }
      filters={{
        Name: {
          type: "search",
          chips: state.name ? [state.name] : [],
          onSearch: (name) => {
            startTransition(() => {
              updateUrl({ name });
              addOptimistic({ name });
            });
          },
          onRemoveChip: () => {
            startTransition(() => {
              updateUrl({ name: undefined });
              addOptimistic({ name: undefined });
            });
          },
          onRemoveGroup: () => {
            startTransition(() => {
              updateUrl({ name: undefined });
              addOptimistic({ name: undefined });
            });
          },
          validate: (value) => true,
          errorMessage: "At least 3 characters",
        },
        "Topic ID": {
          type: "search",
          chips: state.id ? [state.id] : [],
          onSearch: (id) => {
            startTransition(() => {
              updateUrl({ id });
              addOptimistic({ id });
            });
          },
          onRemoveChip: () => {
            startTransition(() => {
              updateUrl({ id: undefined });
              addOptimistic({ id: undefined });
            });
          },
          onRemoveGroup: () => {
            startTransition(() => {
              updateUrl({ id: undefined });
              addOptimistic({ id: undefined });
            });
          },
          validate: (value) => true,
          errorMessage: "At least 3 characters",
        },
        Status: {
          type: "checkbox",
          chips: state.status || [],
          onToggle: (status) => {
            const newStatus = state.status?.includes(status)
              ? state.status.filter((s) => s !== status)
              : [...state.status!, status];
            startTransition(() => {
              updateUrl({ status: newStatus });
              addOptimistic({ status: newStatus });
            });
          },
          onRemoveChip: (status) => {
            const newStatus = (state.status || []).filter((s) => s !== status);
            startTransition(() => {
              updateUrl({ status: newStatus });
              addOptimistic({ status: undefined });
            });
          },
          onRemoveGroup: () => {
            startTransition(() => {
              updateUrl({ status: undefined });
              addOptimistic({ status: undefined });
            });
          },
          options: StatusLabel,
        },
      }}
      onClearAllFilters={clearFilters}
      actions={
        canCreate
          ? [
              {
                label: t("create_topic"),
                onClick: () => {
                  startTransition(() => {
                    router.push(baseurl + "/create");
                  });
                },
                isPrimary: true,
              },
            ]
          : undefined
      }
      tools={[
        <Switch
          key={"ht"}
          label={
            <>
              Hide internal topics&nbsp;
              <Tooltip
                content={
                  "By convention internal topics are prefixed with __. These topics are usually created and managed by Kafka."
                }
              >
                <HelpIcon />
              </Tooltip>
            </>
          }
          isChecked={state.includeHidden === false}
          onChange={(_, checked) =>
            startTransition(() => {
              updateUrl({ hidden: checked ? "n" : "y" });
              addOptimistic({ includeHidden: !checked });
            })
          }
          className={"pf-v5-u-py-xs"}
        />,
      ]}
      variant={TableVariant.compact}
      toolbarBreakpoint={"md"}
    />
  );
}
