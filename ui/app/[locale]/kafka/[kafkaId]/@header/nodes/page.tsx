import { getKafkaCluster } from "@/api/kafka/actions";
import { KafkaParams } from "@/app/[locale]/kafka/[kafkaId]/kafka.params";
import { AppHeader } from "@/components/AppHeader";
import { Number } from "@/components/Number";
import { Label, Spinner, Split, SplitItem } from "@/libs/patternfly/react-core";
import { CheckCircleIcon } from "@/libs/patternfly/react-icons";
import { Suspense } from "react";

export default function NodesHeader({ params }: { params: KafkaParams }) {
  return (
    <Suspense fallback={<Header />}>
      <ConnectedHeader params={params} />
    </Suspense>
  );
}

async function ConnectedHeader({ params }: { params: KafkaParams }) {
  const cluster = await getKafkaCluster(params.kafkaId);
  return <Header total={cluster?.attributes.nodes.length || 0} />;
}

function Header({ total }: { total?: number }) {
  return (
    <AppHeader
      title={
        <Split hasGutter={true}>
          <SplitItem>Brokers</SplitItem>
          <SplitItem>
            <Label
              color={"green"}
              icon={
                total === undefined ? (
                  <Spinner size={"sm"} />
                ) : (
                  <CheckCircleIcon />
                )
              }
            >
              {total && <Number value={total} />}
            </Label>
          </SplitItem>
        </Split>
      }
    />
  );
}
