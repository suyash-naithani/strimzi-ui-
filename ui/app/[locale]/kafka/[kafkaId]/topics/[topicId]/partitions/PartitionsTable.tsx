"use client";
import { getTopic } from "@/api/topics/actions";
import { PartitionStatus, Topic } from "@/api/topics/schema";
import { NoResultsEmptyState } from "@/app/[locale]/kafka/[kafkaId]/topics/[topicId]/partitions/NoResultsEmptyState";
import { Bytes } from "@/components/Bytes";
import { TableView } from "@/components/Table";
import {
  Icon,
  Label,
  LabelGroup,
  PageSection,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
} from "@/libs/patternfly/react-core";
import {
  CheckCircleIcon,
  FlagIcon,
  HelpIcon,
} from "@/libs/patternfly/react-icons";
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import { ReactNode, useEffect, useState } from "react";

const Columns = [
  "id",
  "status",
  "leader",
  "preferredLeader",
  "replicas",
  "storage",
] as const;
const SortColumns = [
  "id",
  "leader",
  "preferredLeader",
  "status",
  "storage",
] as const;
const StatusLabel: Record<PartitionStatus, ReactNode> = {
  FullyReplicated: (
    <>
      <Icon status={"success"}>
        <CheckCircleIcon />
      </Icon>{" "}
      In-sync
    </>
  ),
  UnderReplicated: (
    <>
      <Icon status={"warning"}>
        <ExclamationTriangleIcon />
      </Icon>{" "}
      Under replicated
    </>
  ),
  Offline: (
    <>
      <Icon status={"danger"}>
        <ExclamationCircleIcon />
      </Icon>{" "}
      Offline
    </>
  ),
};

export function PartitionsTable({
  topic: initialData,
  kafkaId,
}: {
  kafkaId: string;
  topic: Topic | undefined;
}) {
  const [topic, setTopic] = useState(initialData);
  const [filter, setFilter] = useState<"all" | PartitionStatus>("all");
  const [sort, setSort] = useState<{
    sort: (typeof SortColumns)[number];
    dir: "asc" | "desc";
  }>({ sort: "id", dir: "asc" });
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (initialData) {
      interval = setInterval(async () => {
        const topic = await getTopic(kafkaId, initialData.id);
        if (topic) {
          setTopic(topic);
        }
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [kafkaId, initialData]);
  const filteredData = topic?.attributes.partitions
    ?.filter((p) => (filter !== "all" ? p.status === filter : true))
    .sort((a, b) => {
      switch (sort.sort) {
        case "id":
          return a.partition - b.partition;
        case "leader":
          return (a.leaderId ?? 0) - (b.leaderId ?? 0);
        case "status":
          return a.status.localeCompare(b.status);
        case "preferredLeader":
          const apl = a.leaderId === a.replicas[0]?.nodeId;
          const bpl = b.leaderId === b.replicas[0]?.nodeId;
          return Number(apl) - Number(bpl);
        case "storage":
          return (a.leaderLocalStorage ?? 0) - (b.leaderLocalStorage ?? 0);
      }
    });
  const sortedData =
    sort.dir === "asc" ? filteredData : filteredData?.reverse();
  return (
    <PageSection isFilled>
      <TableView
        itemCount={sortedData?.length}
        page={1}
        onPageChange={() => {}}
        data={sortedData}
        emptyStateNoData={<div>No partitions</div>}
        emptyStateNoResults={
          <NoResultsEmptyState onReset={() => setFilter("all")} />
        }
        isFiltered={filter !== "all"}
        ariaLabel={"Partitions"}
        columns={Columns}
        renderHeader={({ column, key, Th }) => {
          switch (column) {
            case "id":
              return (
                <Th key={key} dataLabel={"Partition Id"} width={15}>
                  Partition ID
                </Th>
              );
            case "status":
              return (
                <Th key={key} dataLabel={"Status"} width={15}>
                  Status
                </Th>
              );
            case "preferredLeader":
              return (
                <Th key={key} dataLabel={"Preferred leader"} width={20}>
                  Preferred leader{" "}
                  <Tooltip
                    content={`Whenever a new topic is created, Kafka runs its leader election algorithm for each partition to assign a leader from the list of replicas. 
                       This algorithm aims to create a balanced spread of leadership assignments across the brokers. A "Yes" value indicates that the current leader is the preferred leader.
                       A "No" value may indicate that the leadership assignments in the cluster are not balanced.`}
                  >
                    <HelpIcon />
                  </Tooltip>
                </Th>
              );
            case "leader":
              return (
                <Th key={key} dataLabel={"Leader"} width={15}>
                  Leader{" "}
                  <Tooltip
                    style={{ whiteSpace: "pre-line" }}
                    content={`The ID of the partition leader.
                       For a given partition, a broker is elected as the leader, handling all produce requests. Followers on other brokers replicate the leader's data. A follower is considered in-sync if it catches up with the leader's latest committed message. Under-replication occurs when the replicas for a partition fall below the configured replication factor.`}
                  >
                    <HelpIcon />
                  </Tooltip>
                </Th>
              );
            case "replicas":
              return (
                <Th key={key} dataLabel={"Replicas"} width={20}>
                  Replicas{" "}
                  <Tooltip
                    content={`Each partition has designated replicas, with one being the 'leader' and the rest as 'follower' or 'in-sync' partitions. The leader handles produce requests, and followers replicate the leader's data. Replicas can be either "in-sync" or "Under-replicated" in case any of the replicas are not in-sync`}
                  >
                    <HelpIcon />
                  </Tooltip>
                </Th>
              );
            case "storage":
              return (
                <Th key={key} dataLabel={"Storage"}>
                  Size
                </Th>
              );
          }
        }}
        renderCell={({ row, column, key, Td }) => {
          switch (column) {
            case "id":
              return (
                <Td key={key} dataLabel={"Partition Id"}>
                  {row.partition}
                </Td>
              );
            case "status":
              return (
                <Td key={key} dataLabel={"Status"}>
                  {StatusLabel[row.status]}
                </Td>
              );
            case "preferredLeader":
              return (
                <Td key={key} dataLabel={"Preferred leader"}>
                  {row.leaderId !== undefined
                    ? row.leaderId === row.replicas[0]?.nodeId
                      ? "Yes"
                      : "No"
                    : "n/a"}
                </Td>
              );
            case "leader":
              const leader = row.replicas.find(
                (r) => r.nodeId === row.leaderId,
              );
              return (
                <Td key={key} dataLabel={"Leader"}>
                  {leader ? (
                    <Tooltip
                      content={
                        <>
                          Broker ID: {leader.nodeId}
                          <br />
                          Partition leader
                        </>
                      }
                    >
                      <Label
                        color={"cyan"}
                        isCompact={true}
                        icon={<FlagIcon />}
                      >
                        {leader.nodeId}
                      </Label>
                    </Tooltip>
                  ) : (
                    "n/a"
                  )}
                </Td>
              );
            case "replicas":
              return (
                <Td key={key} dataLabel={"Replicas"}>
                  <LabelGroup>
                    {row.replicas
                      .filter((r) => r.nodeId !== row.leaderId)
                      .map((r, idx) => (
                        <Tooltip
                          key={idx}
                          content={
                            <>
                              Broker ID: {r.nodeId}
                              <br />
                              Replica{" "}
                              {r.inSync ? "in-sync" : "under replicated"}
                            </>
                          }
                        >
                          <Label
                            color={!r.inSync ? "red" : undefined}
                            isCompact={true}
                            icon={
                              !r.inSync ? (
                                <Icon status={"warning"}>
                                  <ExclamationTriangleIcon />
                                </Icon>
                              ) : (
                                <Icon status={"success"}>
                                  <CheckCircleIcon />
                                </Icon>
                              )
                            }
                          >
                            {r.nodeId}
                          </Label>
                        </Tooltip>
                      ))}
                  </LabelGroup>
                </Td>
              );
            case "storage":
              return (
                <Td key={key} dataLabel={"Size"}>
                  <Bytes value={row.leaderLocalStorage} />
                </Td>
              );
          }
        }}
        tools={[
          <ToggleGroup key="filter" aria-label="Filter partitions by state">
            <ToggleGroupItem
              text={`All partitions (${topic?.attributes.partitions?.length})`}
              buttonId="all"
              isSelected={filter === "all"}
              onChange={() => {
                setFilter("all");
              }}
            />
            <ToggleGroupItem
              text={
                <>
                  {StatusLabel.FullyReplicated} (
                  {topic?.attributes.partitions?.filter(
                    (p) => p.status === "FullyReplicated",
                  ).length || 0}
                  )
                </>
              }
              buttonId="in-sync"
              isSelected={filter === "FullyReplicated"}
              onChange={() => {
                setFilter("FullyReplicated");
              }}
            />
            <ToggleGroupItem
              text={
                <>
                  {StatusLabel.UnderReplicated} (
                  {topic?.attributes.partitions?.filter(
                    (p) => p.status === "UnderReplicated",
                  ).length || 0}
                  )
                </>
              }
              buttonId="under-replicated"
              isSelected={filter === "UnderReplicated"}
              onChange={() => {
                setFilter("UnderReplicated");
              }}
            />
            <ToggleGroupItem
              text={
                <>
                  {StatusLabel.Offline} (
                  {topic?.attributes.partitions?.filter(
                    (p) => p.status === "Offline",
                  ).length || 0}
                  )
                </>
              }
              buttonId="offline"
              isSelected={filter === "Offline"}
              onChange={() => {
                setFilter("Offline");
              }}
            />
          </ToggleGroup>,
        ]}
        isColumnSortable={(column) => {
          if (column !== "replicas") {
            return {
              columnIndex: SortColumns.indexOf(column),
              label: "",
              onSort: (_, __, dir) => setSort({ sort: column, dir }),
              sortBy: {
                index: SortColumns.indexOf(sort.sort),
                direction: sort.dir,
              },
            };
          }
          return undefined;
        }}
      />
    </PageSection>
  );
}
