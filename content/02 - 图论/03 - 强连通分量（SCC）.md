# 强连通分量（SCC）

节点 `0..n-1`。先 `SCC(n)`，用 `addEdge(u,v)` 加有向边；加完后 `work()`，返回各点的分量编号。改图前先 `init(n)` 重建。

O(n + m) 时间，O(n + m) 空间。

```cpp
// 有向图强连通分量与缩点编号
struct SCC {
    int n;
    std::vector<std::vector<int>> adj;
    std::vector<int> stk;
    std::vector<int> dfn, low, bel; // bel[u] 为 [0,cnt) 的分量编号，编号顺序为逆拓扑序
    int cur, cnt; // cnt 为分量总数

    // 创建未初始化对象；使用前调用 init
    SCC() {}
    // 创建 n 个点的空图
    SCC(int n) {
        init(n);
    }

    // 重置为 n 个点的空图
    void init(int n) {
        this->n = n;
        adj.assign(n, {});
        dfn.assign(n, -1);
        low.resize(n);
        bel.assign(n, -1);
        stk.clear();
        cur = cnt = 0;
    }

    // 加入一条有向边
    void addEdge(int u, int v) {
        adj[u].push_back(v);
    }

    // Tarjan DFS；仅供 work 调用
    void dfs(int x) {
        struct Frame {
            int vertex, parent;
            size_t next;
        };
        std::vector<Frame> frames{{x, -1, 0}};
        dfn[x] = low[x] = cur++;
        stk.push_back(x);
        while (!frames.empty()) {
            auto &frame = frames.back();
            int vertex = frame.vertex;
            if (frame.next < adj[vertex].size()) {
                int next = adj[vertex][frame.next++];
                if (dfn[next] == -1) {
                    dfn[next] = low[next] = cur++;
                    stk.push_back(next);
                    frames.push_back({next, vertex, 0});
                } else if (bel[next] == -1) {
                    low[vertex] = std::min(low[vertex], dfn[next]);
                }
            } else {
                int parent = frame.parent;
                if (dfn[vertex] == low[vertex]) {
                    int member;
                    do {
                        member = stk.back();
                        stk.pop_back();
                        bel[member] = cnt;
                    } while (member != vertex);
                    ++cnt;
                }
                frames.pop_back();
                if (parent != -1)
                    low[parent] = std::min(low[parent], low[vertex]);
            }
        }
    }

    // 返回每个点的强连通分量编号
    std::vector<int> work() {
        for (int i = 0; i < n; i++) {
            if (dfn[i] == -1) {
                dfs(i);
            }
        }
        return bel;
    }
};
```
